const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const upload = require('../middlewares/upload');
const Photo = require('../models/Photo');

// GET /api/photos - 로그인한 유저의 모든 사진 조회
router.get('/', auth, async (req, res) => {
  try {
    const photos = await Photo.find({ owner: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json(photos);
  } catch (error) {
    res.status(500).json({ message: '사진 조회에 실패했습니다.', error });
  }
});

// POST /api/photos - 새 사진 업로드
// 'image'는 프론트엔드에서 FormData에 담을 파일의 필드명입니다.
router.post('/', auth, upload.single('image'), async (req, res) => {
  try {
    const { title, description } = req.body;
    // upload 미들웨어가 S3에 업로드 후 req.file 객체에 파일 정보를 추가해줍니다.
    const imageUrl = req.file.location; 

    const newPhoto = new Photo({
      title,
      description,
      imageUrl,
      owner: req.user.id,
    });

    await newPhoto.save();
    res.status(201).json(newPhoto);
  } catch (error) {
    res.status(500).json({ message: '사진 업로드에 실패했습니다.', error });
  }
});

module.exports = router;