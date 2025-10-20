const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const upload = require('../middlewares/upload');
const Photo = require('../models/Photo');

// GET /api/photos - 로그인한 유저의 모든 맛집 기록 조회
router.get('/', auth, async (req, res) => {
  try {
    const photos = await Photo.find({ owner: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json(photos);
  } catch (error) {
    res.status(500).json({ message: '맛집 기록 조회에 실패했습니다.', error });
  }
});

// POST /api/photos - 새 맛집 기록 업로드
router.post('/', auth, upload.single('image'), async (req, res) => {
  try {
    const { name, location, rating, memo } = req.body;
    // upload 미들웨어가 S3에 업로드 후 req.file 객체에 파일 정보를 추가
    const imageUrl = req.file ? req.file.location : null;
    
    if (!imageUrl) {
        return res.status(400).json({ message: '이미지 파일이 필요합니다.' });
    }

    const newPhoto = new Photo({
      name,
      location,
      rating: parseInt(rating, 10),
      memo,
      imageUrl,
      owner: req.user.id,
    });

    await newPhoto.save();
    res.status(201).json(newPhoto);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '맛집 기록 업로드에 실패했습니다.', error: error.message });
  }
});

// PUT /api/photos/:id - 맛집 기록 수정
router.put('/:id', auth, upload.single('image'), async (req, res) => {
    try {
        const { name, location, rating, memo } = req.body;
        const photo = await Photo.findOne({ _id: req.params.id, owner: req.user.id });

        if (!photo) {
            return res.status(404).json({ message: '수정할 맛집 기록을 찾을 수 없습니다.' });
        }

        // 폼 데이터 업데이트
        photo.name = name || photo.name;
        photo.location = location || photo.location;
        photo.rating = rating ? parseInt(rating, 10) : photo.rating;
        photo.memo = memo !== undefined ? memo : photo.memo; // 빈 문자열로도 업데이트 가능하게

        // 새 이미지가 업로드된 경우에만 imageUrl을 업데이트
        if (req.file) {
            photo.imageUrl = req.file.location;
        }

        const updatedPhoto = await photo.save();
        res.status(200).json(updatedPhoto);
    } catch (error) {
        res.status(500).json({ message: '맛집 기록 수정에 실패했습니다.', error: error.message });
    }
});


// DELETE /api/photos/:id - 맛집 기록 삭제
router.delete('/:id', auth, async (req, res) => {
  try {
    const photo = await Photo.findOneAndDelete({ _id: req.params.id, owner: req.user.id });
    if (!photo) {
      return res.status(404).json({ message: '삭제할 맛집 기록을 찾을 수 없습니다.' });
    }
    // TODO: S3에서 이미지 파일 삭제 로직 추가 (선택 사항)
    res.status(200).json({ message: '맛집 기록이 성공적으로 삭제되었습니다.' });
  } catch (error) {
    res.status(500).json({ message: '맛집 기록 삭제에 실패했습니다.', error: error.message });
  }
});

module.exports = router;