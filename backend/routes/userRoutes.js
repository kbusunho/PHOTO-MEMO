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

module.exports = router;