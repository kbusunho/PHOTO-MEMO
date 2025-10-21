const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const upload = require('../middlewares/upload');
const Photo = require('../models/Photo');

// GET /api/photos - (수정됨) 검색, 정렬, 태그 필터링 기능 추가
router.get('/', auth, async (req, res) => {
  try {
    const { search, sort, tag } = req.query;
    const query = { owner: req.user.id };

    // 1. 검색어 (search) 쿼리
    if (search) {
      const regex = new RegExp(search, 'i'); // case-insensitive regex
      // 이름, 위치, 메모, 태그 배열에서 검색
      query.$or = [
        { name: regex },
        { location: regex },
        { memo: regex },
        { tags: regex }
      ];
    }

    // 2. 태그 (tag) 쿼리 (태그 클릭 시)
    if (tag) {
      query.tags = tag; // 정확히 일치하는 태그가 배열에 포함된 경우
    }

    // 3. 정렬 (sort) 쿼리
    let sortOptions = { createdAt: -1 }; // 기본값: 최신순
    switch (sort) {
      case 'rating_desc':
        sortOptions = { rating: -1, createdAt: -1 }; // 별점 높은 순
        break;
      case 'rating_asc':
        sortOptions = { rating: 1, createdAt: -1 }; // 별점 낮은 순
        break;
      case 'name_asc':
        sortOptions = { name: 1, createdAt: -1 }; // 이름 오름차순
        break;
      // 기본값이 createdAt: -1 (최신순)이므로 default case 불필요
    }

    const photos = await Photo.find(query).sort(sortOptions);
    res.status(200).json(photos);
  } catch (error) {
    res.status(500).json({ message: '맛집 기록 조회에 실패했습니다.', error });
  }
});

// POST /api/photos - (수정됨) 태그 추가 기능
router.post('/', auth, upload.single('image'), async (req, res) => {
  try {
    // 'tags'를 req.body에서 받습니다. (JSON 문자열로 올 예정)
    const { name, location, rating, memo, tags } = req.body;
    const imageUrl = req.file ? req.file.location : null;
    
    if (!imageUrl) {
        return res.status(400).json({ message: '이미지 파일이 필요합니다.' });
    }

    // JSON.parse를 통해 tags 문자열을 배열로 변환
    let tagsArray = [];
    if (tags) {
      try {
        tagsArray = JSON.parse(tags);
      } catch (e) {
        console.error('태그 파싱 오류:', e);
        // 태그 파싱에 실패해도 저장은 계속 진행
      }
    }

    const newPhoto = new Photo({
      name,
      location,
      rating: parseInt(rating, 10),
      memo,
      imageUrl,
      tags: tagsArray, // tags 배열 저장
      owner: req.user.id,
    });

    await newPhoto.save();
    res.status(201).json(newPhoto);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '맛집 기록 업로드에 실패했습니다.', error: error.message });
  }
});

// PUT /api/photos/:id - (수정됨) 태그 수정 기능
router.put('/:id', auth, upload.single('image'), async (req, res) => {
    try {
        // 'tags'를 req.body에서 받습니다.
        const { name, location, rating, memo, tags } = req.body;
        const photo = await Photo.findOne({ _id: req.params.id, owner: req.user.id });

        if (!photo) {
            return res.status(404).json({ message: '수정할 맛집 기록을 찾을 수 없습니다.' });
        }

        // 폼 데이터 업데이트
        photo.name = name || photo.name;
        photo.location = location || photo.location;
        photo.rating = rating ? parseInt(rating, 10) : photo.rating;
        photo.memo = memo !== undefined ? memo : photo.memo;

        // JSON.parse를 통해 tags 문자열을 배열로 변환
        if (tags) {
          try {
            photo.tags = JSON.parse(tags);
          } catch (e) {
            console.error('태그 파싱 오류:', e);
          }
        } else if (tags === undefined) {
          // tags 필드가 요청에 없으면 기존 값 유지
        } else {
          // tags 필드가 "" 빈 문자열 등으로 오면 빈 배열로 설정
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
    // TODO: S3에서 이미지 파일 삭제 로직 추가 (선택 사항)
    res.status(200).json({ message: '맛집 기록이 성공적으로 삭제되었습니다.' });
  } catch (error) {
    res.status(500).json({ message: '맛집 기록 삭제에 실패했습니다.', error: error.message });
  }
});

module.exports = router;