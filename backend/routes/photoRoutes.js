const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth'); // 로그인 확인 미들웨어
const upload = require('../middlewares/upload'); // 파일 업로드 미들웨어
const Photo = require('../models/Photo'); // 맛집 모델
const User = require('../models/User'); // User 모델 (프로필 정보용)
const mongoose = require('mongoose'); // ObjectId 유효성 검사

/**
 * @route   GET /api/photos
 * @desc    내 맛집 목록 조회 (로그인 필요)
 * @access  Private
 */
router.get('/', auth, async (req, res) => {
  try {
    // 요청 쿼리 파라미터 추출
    const {
      page = 1,          // 페이지 번호 (기본 1)
      limit = 12,         // 페이지 당 항목 수 (기본 12)
      search,           // 검색어
      sort,             // 정렬 기준
      tag,              // 태그 필터
      visited,          // 방문 여부 필터 ('true'/'false')
      priceRange        // 가격대 필터 ('₩', '₩₩' 등)
    } = req.query;

    // 기본 쿼리: 현재 로그인한 사용자의 맛집만 조회
    const query = { owner: req.user.id };
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    // --- 필터링 조건 추가 ---
    // 검색어 (이름, 주소, 메모, 태그 대상, 대소문자 구분 없음)
    if (search) {
      const regex = new RegExp(search, 'i');
      query.$or = [
        { name: regex },
        { 'location.address': regex }, // location 객체 안의 address 필드 검색
        { memo: regex },
        { tags: regex } // 배열 필드 검색
      ];
    }
    // 태그 필터 (정확히 일치하는 태그 포함)
    if (tag) { query.tags = tag; }
    // 방문 여부 필터 (문자열 'true'/'false'를 boolean으로 변환)
    if (visited === 'true') { query.visited = true; }
    if (visited === 'false') { query.visited = false; }
    // 가격대 필터
    if (priceRange) { query.priceRange = priceRange; }

    // --- 정렬 조건 설정 ---
    let sortOptions = { createdAt: -1 }; // 기본: 최신순
    switch (sort) {
      case 'rating_desc': sortOptions = { rating: -1, createdAt: -1 }; break; // 별점 높은 순 (+최신순)
      case 'rating_asc':  sortOptions = { rating: 1, createdAt: -1 }; break;  // 별점 낮은 순 (+최신순)
      case 'name_asc':    sortOptions = { name: 1, createdAt: -1 }; break;    // 이름 오름차순 (+최신순)
      case 'price_asc':   sortOptions = { priceRange: 1, createdAt: -1 }; break; // 가격 낮은 순 (+최신순)
      case 'price_desc':  sortOptions = { priceRange: -1, createdAt: -1 }; break; // 가격 높은 순 (+최신순)
    }

    // --- 데이터베이스 조회 (페이지네이션 적용) ---
    const photos = await Photo.find(query) // 필터링 조건 적용
      .sort(sortOptions)                   // 정렬 적용
      .skip((pageNum - 1) * limitNum)      // 건너뛸 항목 수 계산 (페이지 시작점)
      .limit(limitNum);                     // 가져올 항목 수 제한

    // --- 총 개수 및 페이지 계산 ---
    const totalCount = await Photo.countDocuments(query); // 필터링된 총 항목 수
    const totalPages = Math.ceil(totalCount / limitNum); // 총 페이지 수

    // --- 응답 전송 ---
    res.status(200).json({
      photos,           // 현재 페이지의 맛집 목록 배열
      totalPages,       // 전체 페이지 수
      currentPage: pageNum, // 현재 페이지 번호
      totalCount        // 필터링된 총 맛집 개수
    });

  } catch (error) {
    console.error("내 맛집 조회 오류:", error);
    res.status(500).json({ message: '맛집 기록 조회 중 서버 오류가 발생했습니다.', error: error.message });
  }
});

/**
 * @route   GET /api/photos/public/:userId
 * @desc    특정 사용자의 공개된 맛집 목록 조회
 * @access  Public
 */
router.get('/public/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // 요청된 userId 형식 검사 (MongoDB ObjectId 형식)
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: '잘못된 사용자 ID 형식입니다.' });
    }

    // 해당 사용자의 isPublic: true 인 맛집만 조회, 최신순 정렬
    // populate('owner', 'displayName email') 등을 사용하여 작성자 정보 포함 가능
    const publicPhotos = await Photo.find({
      owner: userId,
      isPublic: true
    }).sort({ createdAt: -1 });

    // 프로필 사용자 정보 조회 (닉네임, 이메일만 선택)
    const profileUser = await User.findById(userId).select('displayName email');

    // 사용자가 존재하지 않을 경우 404 응답
    if (!profileUser) {
        return res.status(404).json({ message: '해당 사용자를 찾을 수 없습니다.' });
    }

    // 응답 전송 (공개 맛집 목록 + 사용자 정보)
    res.status(200).json({ photos: publicPhotos, user: profileUser });

  } catch (error) {
    console.error("공개 맛집 조회 오류:", error);
    res.status(500).json({ message: '공개 맛집 기록 조회 중 서버 오류가 발생했습니다.', error: error.message });
  }
});


/**
 * @route   POST /api/photos
 * @desc    새 맛집 기록 생성 (로그인 필요)
 * @access  Private
 */
router.post('/', auth, upload.single('image'), async (req, res) => {
  try {
    // 요청 본문에서 데이터 추출
    const { name, address, rating, memo, tags, visited, isPublic, priceRange } = req.body;
    // S3에 업로드된 이미지 URL 가져오기 (upload 미들웨어 결과)
    const imageUrl = req.file ? req.file.location : null;

    // 필수 값 검증
    if (!imageUrl) { return res.status(400).json({ message: '이미지 파일은 필수입니다.' }); }
    if (!address) { return res.status(400).json({ message: '주소는 필수입니다.' }); }
    // rating 값 검증 (숫자이고 1~5 사이인지) - 스키마에서도 검증하지만 여기서 한번 더 체크 가능
    const ratingNum = parseInt(rating, 10);
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
        return res.status(400).json({ message: '별점은 1에서 5 사이의 숫자여야 합니다.' });
    }

    // 태그 문자열(JSON 형태)을 배열로 변환
    let tagsArray = [];
    if (tags) {
        try {
            const parsedTags = JSON.parse(tags);
            // 배열인지 확인하고 문자열 배열로 변환
            if (Array.isArray(parsedTags)) {
                tagsArray = parsedTags.map(tag => String(tag).trim()).filter(tag => tag);
            }
        } catch (e) {
            console.error('태그 파싱 오류:', e);
            // 파싱 실패 시 오류를 반환하거나 무시할 수 있음
            // return res.status(400).json({ message: '태그 형식이 잘못되었습니다.' });
        }
    }

    // 새 Photo 문서 생성
    const newPhoto = new Photo({
      name,
      location: { address: address }, // location 객체로 저장
      rating: ratingNum,
      memo,
      imageUrl,
      tags: tagsArray,
      owner: req.user.id, // 현재 로그인한 사용자 ID
      visited: visited === 'true', // 문자열 'true' -> boolean true
      isPublic: isPublic === 'true', // 문자열 'true' -> boolean true
      priceRange: priceRange || null // 없으면 null
    });

    // 데이터베이스에 저장
    await newPhoto.save();
    // 성공 응답 (생성된 문서 반환)
    res.status(201).json(newPhoto);

  } catch (error) {
    console.error("맛집 저장 오류:", error);
    // Mongoose Validation Error 처리 (스키마 유효성 검사 실패 시)
    if (error.name === 'ValidationError') {
      // 각 필드의 에러 메시지를 조합하여 반환
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ message: `데이터 검증 실패: ${messages.join(', ')}` });
    }
    // 기타 서버 오류
    res.status(500).json({ message: '맛집 기록 업로드 중 서버 오류가 발생했습니다.', error: error.message });
  }
});

/**
 * @route   PUT /api/photos/:id
 * @desc    맛집 기록 수정 (로그인 필요, 본인 기록만)
 * @access  Private
 */
router.put('/:id', auth, upload.single('image'), async (req, res) => {
    try {
        // 요청 본문과 파라미터에서 데이터 추출
        const { name, address, rating, memo, tags, visited, isPublic, priceRange } = req.body;
        const photoId = req.params.id;
        const userId = req.user.id;

        // 수정할 맛집 기록 찾기 (본인 소유인지 확인 포함)
        const photo = await Photo.findOne({ _id: photoId, owner: userId });

        // 기록이 없거나 권한이 없는 경우 404 응답
        if (!photo) { return res.status(404).json({ message: '수정할 맛집 기록을 찾을 수 없거나 권한이 없습니다.' }); }

        // --- 필드 업데이트 (요청에 해당 필드가 있을 경우에만 업데이트) ---
        if (name !== undefined) photo.name = name;
        if (rating !== undefined) {
             const ratingNum = parseInt(rating, 10);
             if (!isNaN(ratingNum) && ratingNum >= 1 && ratingNum <= 5) {
                 photo.rating = ratingNum;
             }
        }
        if (memo !== undefined) photo.memo = memo;
        if (visited !== undefined) photo.visited = visited === 'true';
        if (isPublic !== undefined) photo.isPublic = isPublic === 'true';
        if (priceRange !== undefined) photo.priceRange = priceRange || null;

        // 주소 업데이트 (값이 제공되었고 기존 주소와 다른 경우)
        if (address !== undefined && address !== photo.location.address) {
            photo.location.address = address;
            // 좌표 업데이트 로직은 제거됨
        }

        // 태그 업데이트
        if (tags !== undefined) { // tags 필드가 요청에 포함된 경우 (빈 문자열 포함)
          if (tags === '') {
              photo.tags = []; // 빈 문자열이면 빈 배열로 설정
          } else {
              try {
                  const parsedTags = JSON.parse(tags);
                   if (Array.isArray(parsedTags)) {
                       photo.tags = parsedTags.map(tag => String(tag).trim()).filter(tag => tag);
                   }
              } catch (e) {
                  console.error('태그 파싱 오류:', e);
                  // 파싱 실패 시 기존 태그 유지 또는 에러 반환 선택
              }
          }
        } // tags 필드가 아예 없으면 기존 값 유지

        // 이미지 업데이트 (새 파일이 업로드된 경우)
        if (req.file) {
            // TODO: 기존 S3 이미지 삭제 로직 추가 (선택 사항)
            photo.imageUrl = req.file.location;
        }

        // 변경사항 저장
        const updatedPhoto = await photo.save();
        // 성공 응답 (수정된 문서 반환)
        res.status(200).json(updatedPhoto);

    } catch (error) {
       console.error("맛집 수정 오류:", error);
       // Mongoose Validation Error 처리
       if (error.name === 'ValidationError') {
         const messages = Object.values(error.errors).map(e => e.message);
         return res.status(400).json({ message: `데이터 검증 실패: ${messages.join(', ')}` });
       }
       // 기타 서버 오류
       res.status(500).json({ message: '맛집 기록 수정 중 서버 오류가 발생했습니다.', error: error.message });
    }
});


/**
 * @route   DELETE /api/photos/:id
 * @desc    맛집 기록 삭제 (로그인 필요, 본인 기록만)
 * @access  Private
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    const photoId = req.params.id;
    const userId = req.user.id;

    // 삭제할 맛집 기록 찾아서 삭제 (본인 소유인지 확인 포함)
    const photo = await Photo.findOneAndDelete({ _id: photoId, owner: userId });

    // 기록이 없거나 권한이 없는 경우 404 응답
    if (!photo) {
      return res.status(404).json({ message: '삭제할 맛집 기록을 찾을 수 없거나 권한이 없습니다.' });
    }

    // TODO: S3에서 이미지 파일 삭제 로직 추가 (선택 사항)
    // 예: const { deleteObject } = require("@aws-sdk/client-s3");
    //     const key = photo.imageUrl.substring(photo.imageUrl.lastIndexOf('/') + 1); // URL에서 키 추출
    //     await s3.send(new deleteObjectCommand({ Bucket: process.env.S3_BUCKET_NAME, Key: `photos/${key}` }));

    // 성공 응답
    res.status(200).json({ message: '맛집 기록이 성공적으로 삭제되었습니다.' });
  } catch (error) {
    console.error("맛집 삭제 오류:", error);
    res.status(500).json({ message: '맛집 기록 삭제 중 서버 오류가 발생했습니다.', error: error.message });
  }
});

module.exports = router;

