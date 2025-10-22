const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const admin = require('../middlewares/admin');
const User = require('../models/User');
const Photo = require('../models/Photo');

/**
 * @route   GET /api/admin/stats
 * @desc    관리자 대시보드 통계 조회
 * @access  Private (Admin)
 */
router.get('/stats', [auth, admin], async (req, res) => {
  try {
    // 1. 총 회원 수
    const totalUsers = await User.countDocuments();

    // 2. 오늘 가입한 회원 수
    // KST (UTC+9) 기준 오늘 날짜 계산
    const today = new Date();
    // 한국 시간 기준으로 오늘 날짜의 시작과 끝 계산 (주의: DB는 보통 UTC 기준)
    // 정확한 시간대 처리는 라이브러리(예: moment-timezone) 사용 권장
    today.setHours(0, 0, 0, 0); // 로컬 시간 기준 자정
    const startOfTodayLocal = today;
    const endOfTodayLocal = new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1); // 로컬 시간 기준 23:59:59.999

    // DB 쿼리를 위해 UTC로 변환 (DB가 UTC 기준일 경우)
    // 실제 서버/DB 시간대 설정에 따라 조정 필요
    const startOfTodayUTC = new Date(startOfTodayLocal.toISOString());
    const endOfTodayUTC = new Date(endOfTodayLocal.toISOString());


    const todayUsers = await User.countDocuments({
      createdAt: {
        $gte: startOfTodayUTC, // UTC 기준 오늘 시작
        $lte: endOfTodayUTC   // UTC 기준 오늘 끝
      }
    });

    // 3. 총 맛집 기록 수
    const totalPhotos = await Photo.countDocuments();

    // 👇 4. 오늘 탈퇴 회원 수 (임시로 0) 추가
    // TODO: 실제 삭제 로그를 추적하는 로직 필요 (예: User 스키마에 isDeleted: Boolean, deletedAt: Date 추가)
    const todayDeletedUsers = 0;

    // 👇 5. todayDeletedUsers를 응답에 포함
    res.status(200).json({
      totalUsers,
      todayUsers,
      todayDeletedUsers, // 👈 추가됨
      totalPhotos
    });

  } catch (error) {
    console.error("통계 조회 오류:", error);
    res.status(500).json({ message: '통계 조회 중 서버 오류가 발생했습니다.', error: error.message });
  }
});

module.exports = router;

