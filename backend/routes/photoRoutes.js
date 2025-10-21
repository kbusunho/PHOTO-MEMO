const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const upload = require('../middlewares/upload');
const Photo = require('../models/Photo');

// GET /api/photos - (수정됨) 페이지네이션 기능 추가
router.get('/', auth, async (req, res) => {
  try {
    // 1. page, limit, search, sort, tag 쿼리 받기
    const { 
      page = 1, // 기본 1페이지
      limit = 12, // 한 페이지에 12개씩
      search, 
      sort, 
      tag 
    } = req.query;

    const query = { owner: req.user.id };
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    // 검색 쿼리 (변경 없음)
    if (search) {
      const regex = new RegExp(search, 'i'); // case-insensitive regex
      query.$or = [
        { name: regex },
        { location: regex },
        { memo: regex },
        { tags: regex }
      ];
    }

    // 태그 쿼리 (변경 없음)
    if (tag) {
      query.tags = tag;
    }

    // 정렬 쿼리 (변경 없음)
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

    // 2. DB에서 데이터 가져오기 (skip, limit 적용)
    // Photo.find(query) : 필터링된 맛집들
    // .sort(sortOptions) : 정렬
    // .skip((pageNum - 1) * limitNum) : (현재페이지-1) * 12개 만큼 건너뛰기
    // .limit(limitNum) : 12개만 가져오기
    const photos = await Photo.find(query)
      .sort(sortOptions)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);
    
    // 3. 필터링된 맛집의 "총 개수" 구하기 (페이지네이션 계산용)
    const totalCount = await Photo.countDocuments(query);
    
    // 4. 총 페이지 수 계산
    const totalPages = Math.ceil(totalCount / limitNum);

    // 5. photos 배열과 totalPages를 함께 반환
    res.status(200).json({ 
      photos, 
      totalPages,
      currentPage: pageNum
    });

  } catch (error) {
    res.status(500).json({ message: '맛집 기록 조회에 실패했습니다.', error: error.message });
  }
});

// POST /api/photos - (변경 없음)
router.post('/', auth, upload.single('image'), async (req, res) => {
  try {
    const { name, location, rating, memo, tags } = req.body;
    const imageUrl = req.file ? req.file.location : null;
    
    if (!imageUrl) {
        return res.status(400).json({ message: '이미지 파일이 필요합니다.' });
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
      location,
      rating: parseInt(rating, 10),
      memo,
      imageUrl,
      tags: tagsArray,
      owner: req.user.id,
    });

    await newPhoto.save();
    res.status(201).json(newPhoto);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '맛집 기록 업로드에 실패했습니다.', error: error.message });
  }
});

// PUT /api/photos/:id - (변경 없음)
router.put('/:id', auth, upload.single('image'), async (req, res) => {
    try {
        const { name, location, rating, memo, tags } = req.body;
        const photo = await Photo.findOne({ _id: req.params.id, owner: req.user.id });

        if (!photo) {
            return res.status(404).json({ message: '수정할 맛집 기록을 찾을 수 없습니다.' });
        }

        photo.name = name || photo.name;
        photo.location = location || photo.location;
        photo.rating = rating ? parseInt(rating, 10) : photo.rating;
        photo.memo = memo !== undefined ? memo : photo.memo;

        if (tags) {
          try {
            photo.tags = JSON.parse(tags);
          } catch (e) {
            console.error('태그 파싱 오류:', e);
          }
        } else if (tags === undefined) {
          // tags 필드가 요청에 없으면 기존 값 유지
        } else {
           photo.tags = [];
        }

        if (req.file) {
            photo.imageUrl = req.file.location;
        }

        const updatedPhoto = await photo.save();
        res.status(200).json(updatedPhoto);
    } catch (error) {
        res.status(500).json({ message: '맛집 기록 수정에 실패했습니다.', error: error.message });
    }
});


// DELETE /api/photos/:id - (변경 없음)
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