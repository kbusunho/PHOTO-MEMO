const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const admin = require('../middlewares/admin'); // 방금 만든 admin 미들웨어
const User = require('../models/User');

/**
 * @route   GET /api/users
 * @desc    모든 사용자 목록 조회 (관리자 전용)
 * @access  Private (Admin)
 */
// [auth, admin] : auth로 로그인 확인 -> admin으로 관리자 확인
router.get('/', [auth, admin], async (req, res) => {
  try {
    // 모든 사용자를 찾되, 비밀번호(passwordHash)는 제외하고 보냅니다.
    const users = await User.find().select('-passwordHash').sort({ createdAt: -1 });
    res.status(200).json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '사용자 목록 조회에 실패했습니다.', error: error.message });
  }
});

// ======================================================
// 👇👇👇 이 부분이 새로 추가되었습니다! 👇👇👇
// ======================================================
/**
 * @route   DELETE /api/users/:id
 * @desc    특정 사용자 삭제 (관리자 전용)
 * @access  Private (Admin)
 */
router.delete('/:id', [auth, admin], async (req, res) => {
  try {
    const userIdToDelete = req.params.id;
    const adminUserId = req.user.id; // 현재 로그인한 관리자 ID

    // 1. 자기 자신을 삭제하려는지 확인
    if (userIdToDelete === adminUserId) {
      return res.status(400).json({ message: '관리자 계정은 스스로 삭제할 수 없습니다.' });
    }

    // 2. 삭제할 사용자 찾기
    const user = await User.findById(userIdToDelete);
    if (!user) {
      return res.status(404).json({ message: '삭제할 사용자를 찾을 수 없습니다.' });
    }

    // 3. (선택 사항) 해당 유저가 작성한 맛집 기록(photos)도 함께 삭제
    // const Photo = require('../models/Photo'); // Photo 모델 임포트
    // await Photo.deleteMany({ owner: userIdToDelete });

    // 4. 사용자 삭제
    await User.findByIdAndDelete(userIdToDelete);

    res.status(200).json({ message: '사용자가 성공적으로 삭제되었습니다.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '사용자 삭제에 실패했습니다.', error: error.message });
  }
});

module.exports = router;