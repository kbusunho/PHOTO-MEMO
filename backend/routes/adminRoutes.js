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
    today.setHours(today.getHours() + 9); // KST로 변경
    today.setHours(0, 0, 0, 0); // KST 00:00:00
    
    const startOfToday = new Date(today.getTime() - (9 * 60 * 60 * 1000)); // 다시 UTC로

    const endOfToday = new Date(startOfToday.getTime() + (24 * 60 * 60 * 1000 - 1)); // KST 23:59:59.999
    
    const todayUsers = await User.countDocuments({
      createdAt: {
        $gte: startOfToday,
        $lte: endOfToday
      }
    });

    // 3. 총 맛집 기록 수
    const totalPhotos = await Photo.countDocuments();

    res.status(200).json({
      totalUsers,
      todayUsers,
      totalPhotos
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '통계 조회에 실패했습니다.', error: error.message });
  }
});

module.exports = router;