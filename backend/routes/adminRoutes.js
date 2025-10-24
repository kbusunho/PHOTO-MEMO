const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const admin = require('../middlewares/admin');
const User = require('../models/User');
const Photo = require('../models/Photo');
const Report = require('../models/Report'); // Report 모델 임포트
const mongoose = require('mongoose');

/**
 * @route   GET /api/admin/stats
 * @desc    관리자 대시보드 통계 조회
 * @access  Private (Admin)
 */
router.get('/stats', [auth, admin], async (req, res) => {
  try {
    // 1. 총 회원 수
    const totalUsers = await User.countDocuments();

    // 2. 오늘 가입한 회원 수 (UTC 기준)
    // 참고: new Date()는 서버 시간을 기준으로 하므로, 서버가 UTC라면 UTC 자정 기준.
    const startOfToday = new Date();
    startOfToday.setUTCHours(0, 0, 0, 0); // UTC 자정
    const endOfToday = new Date(startOfToday);
    endOfToday.setUTCDate(startOfToday.getUTCDate() + 1); // UTC 기준 다음 날 자정
    endOfToday.setUTCMilliseconds(endOfToday.getUTCMilliseconds() - 1); // UTC 23:59:59.999

    const todayUsers = await User.countDocuments({
      createdAt: {
        $gte: startOfToday,
        $lte: endOfToday
      }
    });

    // 3. 총 맛집 기록 수
    const totalPhotos = await Photo.countDocuments();

    // 4. 오늘 탈퇴 회원 수 (임시로 0)
    // TODO: 실제 삭제 로그를 추적하는 로직 필요 (예: User 스키마에 isDeleted: Boolean, deletedAt: Date 추가)
    const todayDeletedUsers = 0;
    
    // 5. 처리 대기 중인 신고 건수 추가
    const pendingReports = await Report.countDocuments({ status: 'Pending' });


    // 6. 모든 통계 응답
    res.status(200).json({
      totalUsers,
      todayUsers,
      todayDeletedUsers,
      totalPhotos,
      pendingReports // 👈 신고 건수 추가됨
    });

  } catch (error) {
    console.error("통계 조회 오류:", error);
    res.status(500).json({ message: '통계 조회에 실패했습니다.', error: error.message });
  }
});

// ======================================================
// 👇👇👇 신고 관리 API 추가됨 👇👇👇
// ======================================================

/**
 * @route   GET /api/admin/reports
 * @desc    신고 목록 조회 (관리자 전용, 상태별 필터링, 페이지네이션)
 * @access  Private (Admin)
 */
router.get('/reports', [auth, admin], async (req, res) => {
    try {
        const { status = 'Pending', page = 1, limit = 10 } = req.query; // 기본: 대기중인 신고
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);

        const query = {};
        if (['Pending', 'Resolved', 'Dismissed'].includes(status)) {
            query.status = status;
        } // 잘못된 status 값이 오면 모든 상태 조회

        const reports = await Report.find(query)
            .sort({ createdAt: -1 }) // 최신 신고 순
            .skip((pageNum - 1) * limitNum)
            .limit(limitNum)
            .populate('reporter', 'displayName email') // 신고자 정보
            .populate('targetPhotoId', 'name imageUrl owner') // 관련 게시글 정보 (간단히)
            .populate({
                path: 'targetPhotoId',
                populate: {
                    path: 'comments.owner', // 댓글 작성자 정보
                    model: 'User', // User 모델 참조
                    select: 'displayName email'
                }
            });

        // 댓글 신고의 경우, 댓글 내용만 추출
        const processedReports = reports.map(report => {
            const reportObj = report.toObject(); // Mongoose 문서를 일반 객체로 변환
            if (reportObj.targetType === 'Comment' && reportObj.targetPhotoId && reportObj.targetPhotoId.comments) {
                // 신고 대상 댓글 찾기
                const targetComment = reportObj.targetPhotoId.comments.find(c => c._id.equals(reportObj.targetId));
                reportObj.targetComment = targetComment; // 찾은 댓글 정보 추가
                
                // 불필요한 전체 댓글 목록 제거 (응답 데이터 경량화)
                if (reportObj.targetPhotoId) {
                   delete reportObj.targetPhotoId.comments;
                }
            }
            return reportObj;
        });

        const totalCount = await Report.countDocuments(query);
        const totalPages = Math.ceil(totalCount / limitNum);

        res.status(200).json({
            reports: processedReports, // 처리된 신고 목록
            totalPages,
            currentPage: pageNum,
            totalCount
        });

    } catch (error) {
        console.error("신고 목록 조회 오류:", error);
        res.status(500).json({ message: '신고 목록 조회 실패', error: error.message });
    }
});


/**
 * @route   PUT /api/admin/reports/:reportId
 * @desc    신고 처리 (상태 변경: Resolved 또는 Dismissed)
 * @access  Private (Admin)
 */
router.put('/reports/:reportId', [auth, admin], async (req, res) => {
    try {
        const { reportId } = req.params;
        const { newStatus } = req.body; // 'Resolved' 또는 'Dismissed'
        const adminUserId = req.user.id; // 처리한 관리자 ID

        if (!mongoose.Types.ObjectId.isValid(reportId)) {
             return res.status(400).json({ message: '잘못된 신고 ID 형식입니다.' });
        }
        if (!['Resolved', 'Dismissed'].includes(newStatus)) {
            return res.status(400).json({ message: '잘못된 처리 상태값입니다. (Resolved 또는 Dismissed만 가능)' });
        }

        const report = await Report.findById(reportId);
        if (!report) {
            return res.status(404).json({ message: '처리할 신고를 찾을 수 없습니다.' });
        }
        if (report.status !== 'Pending') {
             return res.status(400).json({ message: '이미 처리된 신고입니다.' });
        }

        // 상태 업데이트
        report.status = newStatus;
        report.resolvedBy = adminUserId;
        report.resolvedAt = new Date();

        await report.save();

        // (선택 사항) 'Resolved' 상태일 경우, 실제 게시글/댓글 자동 삭제 로직
        // if (newStatus === 'Resolved') {
        //     if (report.targetType === 'Comment') {
        //         await Photo.updateOne(
        //             { _id: report.targetPhotoId },
        //             { $pull: { comments: { _id: report.targetId } } }
        //         );
        //     }
        //     if (report.targetType === 'Photo') {
        //         await Photo.findByIdAndDelete(report.targetId);
        //         // 관련된 S3 이미지, 댓글, 신고 내역 등도 모두 삭제 필요
        //     }
        // }

        // populate 해서 반환 (처리 결과 확인용)
        const updatedReport = await Report.findById(reportId)
                                          .populate('reporter', 'displayName email')
                                          .populate('resolvedBy', 'displayName email');

        res.status(200).json(updatedReport);

    } catch (error) {
        console.error("신고 처리 오류:", error);
        res.status(500).json({ message: '신고 처리 실패', error: error.message });
    }
});


module.exports = router;

