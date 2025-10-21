const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const admin = require('../middlewares/admin');
const User = require('../models/User');

// GET /api/users - (변경 없음)
router.get('/', [auth, admin], async (req, res) => {
  try {
    const users = await User.find().select('-passwordHash').sort({ createdAt: -1 });
    res.status(200).json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '사용자 목록 조회에 실패했습니다.', error: error.message });
  }
});

// DELETE /api/users/:id - (변경 없음)
router.delete('/:id', [auth, admin], async (req, res) => {
  try {
    const userIdToDelete = req.params.id;
    const adminUserId = req.user.id; 

    if (userIdToDelete === adminUserId) {
      return res.status(400).json({ message: '관리자 계정은 스스로 삭제할 수 없습니다.' });
    }

    const user = await User.findById(userIdToDelete);
    if (!user) {
      return res.status(404).json({ message: '삭제할 사용자를 찾을 수 없습니다.' });
    }

    // (선택 사항) 해당 유저가 작성한 맛집 기록(photos)도 함께 삭제
    const Photo = require('../models/Photo'); // Photo 모델 임포트
    await Photo.deleteMany({ owner: userIdToDelete });

    await User.findByIdAndDelete(userIdToDelete);

    res.status(200).json({ message: '사용자가 성공적으로 삭제되었습니다.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '사용자 삭제에 실패했습니다.', error: error.message });
  }
});

// ======================================================
// 👇👇👇 이 PUT 엔드포인트가 새로 추가되었습니다! 👇👇👇
// ======================================================
/**
 * @route   PUT /api/users/:id
 * @desc    특정 사용자 정보 수정 (관리자 전용)
 * @access  Private (Admin)
 */
router.put('/:id', [auth, admin], async (req, res) => {
  try {
    const { displayName, role } = req.body;
    const userIdToEdit = req.params.id;
    const adminUserId = req.user.id;

    // 1. 수정할 사용자 찾기
    const user = await User.findById(userIdToEdit);
    if (!user) {
      return res.status(404).json({ message: '수정할 사용자를 찾을 수 없습니다.' });
    }

    // 2. 관리자 본인 권한 변경 시도 방지 (특히 유일한 관리자일 경우)
    if (userIdToEdit === adminUserId && role && user.role === 'admin' && role !== 'admin') {
      // 본인 권한을 admin이 아닌 것으로 바꾸려고 할 때
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        return res.status(400).json({ message: '유일한 관리자 계정의 권한은 변경할 수 없습니다.' });
      }
    }
    
    // 3. 필드 업데이트
    if (displayName !== undefined) {
      user.displayName = displayName;
    }
    if (role && ['user', 'admin'].includes(role)) {
      user.role = role;
    }

    await user.save();
    
    // 4. 업데이트된 사용자 정보 반환 (비밀번호 제외)
    res.status(200).json(user.toSafeJSON());

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '사용자 정보 수정에 실패했습니다.', error: error.message });
  }
});


module.exports = router;