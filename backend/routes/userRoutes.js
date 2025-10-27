const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth'); // 로그인 확인 미들웨어
const admin = require('../middlewares/admin'); // 관리자 확인 미들웨어
const User = require('../models/User'); // User 모델
const Photo = require('../models/Photo'); // Photo 모델 (관련 데이터 삭제용)
const Report = require('../models/Report'); // Report 모델 (관련 데이터 삭제용)
const mongoose = require('mongoose'); // ObjectId 유효성 검사

/**
 * @route   GET /api/users
 * @desc    모든 사용자 목록 조회 (관리자 전용)
 * @access  Private (Admin)
 */
router.get('/', [auth, admin], async (req, res) => {
  try {
    // 비밀번호 해시 제외하고 모든 필드 조회
    const users = await User.find().select('-passwordHash').sort({ createdAt: -1 });
    res.status(200).json(users);
  } catch (error) {
    console.error("사용자 목록 조회 오류:", error);
    res.status(500).json({ message: '사용자 목록 조회 중 서버 오류가 발생했습니다.', error: error.message });
  }
});

/**
 * @route   DELETE /api/users/me
 * @desc    로그인한 사용자 본인 계정 삭제 (회원 탈퇴)
 * @access  Private (User - 본인만 가능)
 */
router.delete('/me', auth, async (req, res) => {
  try {
    const userIdToDelete = req.user.id; // auth 미들웨어에서 넣어준 로그인 사용자 ID

    // 1. 사용자 정보 확인 (관리자인지 등)
    const user = await User.findById(userIdToDelete);
    if (!user) {
        return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }
    // 2. 마지막 관리자인 경우 탈퇴 방지
    if (user.role === 'admin') {
      const activeAdminCount = await User.countDocuments({ role: 'admin', isActive: true });
      if (activeAdminCount <= 1) {
        return res.status(400).json({ message: '유일한 활성 관리자 계정은 탈퇴할 수 없습니다. 다른 관리자를 먼저 지정해주세요.' });
      }
    }
    
    // --- 회원 탈퇴 시 모든 데이터 정리 ---
    // 3. 이 사용자가 소유한 Photo ID 목록 찾기 (신고 내역 삭제에 필요)
    const userPhotos = await Photo.find({ owner: userIdToDelete }).select('_id');
    const userPhotoIds = userPhotos.map(p => p._id);
    
    // 4. 이 사용자의 Photo와 관련된 모든 신고 삭제 (대상, 신고자 무관)
    await Report.deleteMany({ targetPhotoId: { $in: userPhotoIds } });
    
    // 5. 이 사용자가 작성한 모든 신고 삭제
    await Report.deleteMany({ reporter: userIdToDelete });
    
    // 6. 다른 사람 게시물에 이 사용자가 남긴 댓글 삭제
    await Photo.updateMany(
        { "comments.owner": userIdToDelete },
        { $pull: { comments: { owner: userIdToDelete } } }
    );
    
    // 7. 다른 사람 게시물에 이 사용자가 누른 좋아요 삭제
    await Photo.updateMany(
        { likes: userIdToDelete },
        { $pull: { likes: userIdToDelete } }
    );
    
    // 8. 이 사용자가 소유한 모든 Photo 삭제
    await Photo.deleteMany({ owner: userIdToDelete });
    
    // 9. 사용자 계정 삭제
    await User.findByIdAndDelete(userIdToDelete);

    res.status(200).json({ message: '회원 탈퇴가 성공적으로 처리되었습니다. 모든 데이터가 삭제되었습니다.' });
  } catch (error) {
    console.error("회원 탈퇴 오류:", error);
    res.status(500).json({ message: '회원 탈퇴 중 서버 오류가 발생했습니다.', error: error.message });
  }
});

/**
 * @route   DELETE /api/users/:id
 * @desc    특정 사용자 삭제 (관리자 전용)
 * @access  Private (Admin)
 */
router.delete('/:id', [auth, admin], async (req, res) => {
  try {
    const userIdToDelete = req.params.id;
    const adminUserId = req.user.id; // ID of the admin performing the action

    // 관리자 본인 삭제 방지
    if (userIdToDelete === adminUserId) {
      return res.status(400).json({ message: '관리자 계정은 스스로 삭제할 수 없습니다. (본인 탈퇴는 /me 경로 이용)' });
    }

    // 삭제할 사용자 찾기
    const user = await User.findById(userIdToDelete);
    if (!user) {
      return res.status(404).json({ message: '삭제할 사용자를 찾을 수 없습니다.' });
    }

    // --- 관리자가 사용자를 삭제할 때도 모든 데이터를 정리합니다 (회원 탈퇴 로직과 동일) ---
    // 1. 이 사용자가 소유한 Photo ID 목록 찾기
    const userPhotos = await Photo.find({ owner: userIdToDelete }).select('_id');
    const userPhotoIds = userPhotos.map(p => p._id);
    
    // 2. 이 사용자의 Photo와 관련된 모든 신고 삭제
    await Report.deleteMany({ targetPhotoId: { $in: userPhotoIds } });
    
    // 3. 이 사용자가 작성한 모든 신고 삭제
    await Report.deleteMany({ reporter: userIdToDelete });
    
    // 4. 다른 사람 게시물에 이 사용자가 남긴 댓글 삭제
    await Photo.updateMany(
        { "comments.owner": userIdToDelete },
        { $pull: { comments: { owner: userIdToDelete } } }
    );
    
    // 5. 다른 사람 게시물에 이 사용자가 누른 좋아요 삭제
    await Photo.updateMany(
        { likes: userIdToDelete },
        { $pull: { likes: userIdToDelete } }
    );
    
    // 6. 이 사용자가 소유한 모든 Photo 삭제
    await Photo.deleteMany({ owner: userIdToDelete });
    
    // 7. 사용자 계정 삭제
    await User.findByIdAndDelete(userIdToDelete);

    res.status(200).json({ message: '사용자가 성공적으로 삭제되었습니다. (관련 데이터 포함)' });
  } catch (error) {
    console.error("사용자 삭제 오류 (관리자):", error);
    res.status(500).json({ message: '사용자 삭제 중 서버 오류가 발생했습니다.', error: error.message });
  }
});

/**
 * @route   PUT /api/users/:id
 * @desc    특정 사용자 정보 수정 (관리자 전용 - 닉네임, 권한, 상태)
 * @access  Private (Admin)
 */
router.put('/:id', [auth, admin], async (req, res) => {
  try {
    const { displayName, role, isActive } = req.body;
    const userIdToEdit = req.params.id;
    const adminUserId = req.user.id;

    // 수정할 사용자 찾기
    const user = await User.findById(userIdToEdit);
    if (!user) { return res.status(404).json({ message: '수정할 사용자를 찾을 수 없습니다.' }); }

    // 유일한 활성 관리자 권한 변경/비활성화 방지
    if (user.role === 'admin') { // 수정 대상이 관리자인 경우
      const activeAdminCount = await User.countDocuments({ role: 'admin', isActive: true });
      
      // 권한을 'user'로 변경 시도
      if (role && role !== 'admin') {
          if (activeAdminCount <= 1 && user.isActive) { // 마지막 활성 관리자면
              return res.status(400).json({ message: '유일한 활성 관리자 계정의 권한은 변경할 수 없습니다.' });
          }
      }
      // '비활성' 상태로 변경 시도
      const requestedIsActive = (isActive === true || isActive === 'true');
      if (isActive !== undefined && !requestedIsActive) { // 비활성화 시도
          if (activeAdminCount <= 1 && user.isActive) { // 마지막 활성 관리자면
               return res.status(400).json({ message: '유일한 활성 관리자 계정은 비활성화할 수 없습니다.' });
          }
      }
    }

    // 필드 업데이트
    if (displayName !== undefined) {
        user.displayName = displayName.trim();
    }
    if (role && ['user', 'admin'].includes(role)) {
        user.role = role;
    }
    if (isActive !== undefined) {
        user.isActive = (isActive === true || isActive === 'true');
    }

    await user.save();
    res.status(200).json(user.toSafeJSON());

  } catch (error) {
    if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map(e => e.message);
        return res.status(400).json({ message: `수정 실패: ${messages.join(', ')}` });
    }
    console.error("사용자 정보 수정 오류 (관리자):", error);
    res.status(500).json({ message: '사용자 정보 수정 중 서버 오류가 발생했습니다.', error: error.message });
  }
});


module.exports = router;

