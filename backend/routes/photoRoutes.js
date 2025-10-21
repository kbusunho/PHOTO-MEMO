const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const upload = require('../middlewares/upload');
const Photo = require('../models/Photo');

// GET /api/photos - 페이지네이션, 검색, 정렬 기능
router.get('/', auth, async (req, res) => {
  try {
    const { 
      page = 1,
      limit = 12,
      search, 
      sort, 
      tag 
    } = req.query;

    const query = { owner: req.user.id };
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    if (search) {
      const regex = new RegExp(search, 'i');
      query.$or = [
        { name: regex },
        // 👇 이전 수정사항: 'location' -> 'location.address'
        { 'location.address': regex }, 
        { memo: regex },
        { tags: regex }
      ];
    }

    if (tag) {
      query.tags = tag;
    }

    let sortOptions = { createdAt: -1 };
    switch (sort) {
      case 'rating_desc':
        sortOptions = { rating: -1, createdAt: -1 };
        break;
      case 'rating_asc':
        sortOptions = { rating: 1, createdAt: -1 };
        break;
      case 'name_asc':
        sortOptions = { name: 1, createdAt: -1 };
        break;
    }

    const photos = await Photo.find(query)
      .sort(sortOptions)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);
    
    const totalCount = await Photo.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limitNum);

    // 👇👇👇 이 부분에 totalCount를 추가했습니다! 👇👇👇
    res.status(200).json({ 
      photos, 
      totalPages,
      currentPage: pageNum,
      totalCount // 👈 이 값을 프론트엔드에서 사용할 겁니다.
    });

  } catch (error) {
    res.status(500).json({ message: '맛집 기록 조회에 실패했습니다.', error: error.message });
  }
});

// POST /api/photos - 새 맛집 기록 생성
router.post('/', auth, upload.single('image'), async (req, res) => {
  try {
    const { name, address, rating, memo, tags } = req.body;
    const imageUrl = req.file ? req.file.location : null;
    
    if (!imageUrl) {
        return res.status(400).json({ message: '이미지 파일이 필요합니다.' });
    }
    if (!address) {
      return res.status(400).json({ message: '주소(address) 값이 필요합니다.' });
    }

    let tagsArray = [];
    if (tags) {
      try {
        tagsArray = JSON.parse(tags);
      } catch (e) {
        console.error('태그 파싱 오류:', e);
      }
    }

    const newPhoto = new Photo({
      name,
      location: {
        address: address 
      },
      rating: parseInt(rating, 10),
      memo,
      imageUrl,
      tags: tagsArray,
      owner: req.user.id,
    });

    await newPhoto.save();
    res.status(201).json(newPhoto);
  } catch (error) {
    console.error("맛집 저장 중 오류 발생:", error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ message: `데이터 검증 실패: ${messages.join(', ')}` });
    }
    res.status(500).json({ message: '맛집 기록 업로드에 실패했습니다.', error: error.message });
  }
});

// PUT /api/photos/:id - 맛집 기록 수정
router.put('/:id', auth, upload.single('image'), async (req, res) => {
    try {
        const { name, address, rating, memo, tags } = req.body;
        const photo = await Photo.findOne({ _id: req.params.id, owner: req.user.id });

        if (!photo) {
             return res.status(404).json({ message: '수정할 맛집 기록을 찾을 수 없습니다.' });
        }

        photo.name = name !== undefined ? name : photo.name;
        photo.rating = rating !== undefined ? parseInt(rating, 10) : photo.rating;
        photo.memo = memo !== undefined ? memo : photo.memo;

        if (address !== undefined) {
            photo.location.address = address;
        }

        if (tags) {
          try {
            photo.tags = JSON.parse(tags);
          } catch (e) { console.error('태그 파싱 오류:', e); }
        } else if (tags === undefined) { 
        } else { 
           photo.tags = [];
        }

        if (req.file) {
            photo.imageUrl = req.file.location;
        }

        const updatedPhoto = await photo.save();
        res.status(200).json(updatedPhoto);
    } catch (error) {
       console.error("맛집 수정 중 오류 발생:", error);
       if (error.name === 'ValidationError') {
         const messages = Object.values(error.errors).map(e => e.message);
         return res.status(400).json({ message: `데이터 검증 실패: ${messages.join(', ')}` });
       }
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
    res.status(200).json({ message: '맛집 기록이 성공적으로 삭제되었습니다.' });
  } catch (error) {
    res.status(500).json({ message: '맛집 기록 삭제에 실패했습니다.', error: error.message });
  }
});

module.exports = router;

