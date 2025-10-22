const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const admin = require('../middlewares/admin');
const User = require('../models/User');
const Photo = require('../models/Photo'); // Photo 모델 임포트 (삭제 시 관련 데이터 처리용)

/**
 * @route   GET /api/users
 * @desc    모든 사용자 목록 조회 (관리자 전용)
 * @access  Private (Admin)
 */
router.get('/', [auth, admin], async (req, res) => {
  try {
    // 비밀번호 해시 제외하고 모든 필드 조회 (phoneNumber 포함됨)
    const users = await User.find().select('-passwordHash').sort({ createdAt: -1 });
    res.status(200).json(users);
  } catch (error) {
    console.error("사용자 목록 조회 오류:", error);
    res.status(500).json({ message: '사용자 목록 조회 중 서버 오류가 발생했습니다.', error: error.message });
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
    const adminUserId = req.user.id; // 현재 로그인한 관리자 ID

    // 자기 자신 삭제 방지
    if (userIdToDelete === adminUserId) {
      return res.status(400).json({ message: '관리자 계정은 스스로 삭제할 수 없습니다.' });
    }

    // 삭제할 사용자 찾기
    const user = await User.findById(userIdToDelete);
    if (!user) {
      return res.status(404).json({ message: '삭제할 사용자를 찾을 수 없습니다.' });
    }

    // (선택 사항) 해당 사용자가 작성한 맛집 기록(photos)도 함께 삭제
    // 이 부분을 주석 해제하면 사용자를 삭제할 때 그 사용자의 맛집 기록도 모두 지워집니다.
    // await Photo.deleteMany({ owner: userIdToDelete });

    // 사용자 삭제
    await User.findByIdAndDelete(userIdToDelete);

    res.status(200).json({ message: '사용자가 성공적으로 삭제되었습니다.' });
  } catch (error) {
    console.error("사용자 삭제 오류:", error);
    res.status(500).json({ message: '사용자 삭제 중 서버 오류가 발생했습니다.', error: error.message });
  }
});

/**
 * @route   PUT /api/users/:id
 * @desc    특정 사용자 정보 수정 (관리자 전용 - 닉네임, 권한)
 * @access  Private (Admin)
 */
router.put('/:id', [auth, admin], async (req, res) => {
  try {
    const { displayName, role } = req.body; // 전화번호 수정은 제외
    const userIdToEdit = req.params.id;
    const adminUserId = req.user.id;

    // 수정할 사용자 찾기
    const user = await User.findById(userIdToEdit);
    if (!user) {
      return res.status(404).json({ message: '수정할 사용자를 찾을 수 없습니다.' });
    }

    // 관리자 본인 권한 변경 시도 방지 (유일한 관리자일 경우)
    if (userIdToEdit === adminUserId && role && user.role === 'admin' && role !== 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        return res.status(400).json({ message: '유일한 관리자 계정의 권한은 변경할 수 없습니다.' });
      }
    }

    // 필드 업데이트 (제공된 값만 업데이트)
    if (displayName !== undefined) {
      user.displayName = displayName;
    }
    if (role && ['user', 'admin'].includes(role)) {
      user.role = role;
    }
    // phoneNumber 수정 로직은 여기에 추가하지 않았습니다.

    await user.save();

    // 업데이트된 사용자 정보 반환 (비밀번호 제외)
    res.status(200).json(user.toSafeJSON());

  } catch (error) {
    // Mongoose Validation Error 처리
    if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map(e => e.message);
        return res.status(400).json({ message: `수정 실패: ${messages.join(', ')}` });
    }
    console.error("사용자 정보 수정 오류:", error);
    res.status(500).json({ message: '사용자 정보 수정 중 서버 오류가 발생했습니다.', error: error.message });
  }
});


module.exports = router;
