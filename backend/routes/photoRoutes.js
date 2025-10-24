const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth'); // 로그인 확인 미들웨어
const upload = require('../middlewares/upload'); // 파일 업로드 미들웨어
const Photo = require('../models/Photo'); // 맛집 모델
const User = require('../models/User'); // User 모델 (프로필 정보 및 댓글 populate 용)
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
      search,             // 검색어
      sort,               // 정렬 기준
      tag,                // 태그 필터
      visited,            // 방문 여부 필터 ('true'/'false')
      priceRange          // 가격대 필터 ('₩', '₩₩' 등)
    } = req.query;

    // 기본 쿼리: 현재 로그인한 사용자의 맛집만 조회
    const query = { owner: req.user.id };
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    // --- 필터링 조건 추가 ---
    if (search) {
      const regex = new RegExp(search, 'i');
      query.$or = [
        { name: regex },
        { 'location.address': regex },
        { memo: regex },
        { tags: regex }
      ];
    }
    if (tag) { query.tags = tag; }
    if (visited === 'true') { query.visited = true; }
    if (visited === 'false') { query.visited = false; }
    if (priceRange) { query.priceRange = priceRange; }

    // --- 정렬 조건 설정 ---
    let sortOptions = { createdAt: -1 }; // 기본: 최신순
    switch (sort) {
      case 'rating_desc': sortOptions = { rating: -1, createdAt: -1 }; break;
      case 'rating_asc':  sortOptions = { rating: 1, createdAt: -1 }; break;
      case 'name_asc':    sortOptions = { name: 1, createdAt: -1 }; break;
      case 'price_asc':   sortOptions = { priceRange: 1, createdAt: -1 }; break;
      case 'price_desc':  sortOptions = { priceRange: -1, createdAt: -1 }; break;
    }

    // --- 데이터베이스 조회 (페이지네이션 적용 + 댓글 populate 추가) ---
    const photos = await Photo.find(query)
      .sort(sortOptions)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .populate('owner', 'displayName email') // 게시글 작성자 정보
      .populate('comments.owner', 'displayName email'); // 댓글 작성자 정보

    // --- 총 개수 및 페이지 계산 ---
    const totalCount = await Photo.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limitNum);

    // --- 응답 전송 ---
    res.status(200).json({
      photos,
      totalPages,
      currentPage: pageNum,
      totalCount
    });

  } catch (error) {
    console.error("내 맛집 조회 오류:", error);
    res.status(500).json({ message: '맛집 기록 조회 중 서버 오류가 발생했습니다.', error: error.message });
  }
});

/**
 * @route   GET /api/photos/feed
 * @desc    모든 사용자의 공개 맛집 목록 조회 (로그인 필요)
 * @access  Private (User)
 */
router.get('/feed', auth, async (req, res) => {
  try {
    const {
        page = 1,
        limit = 12,
        sort = 'createdAt_desc'
    } = req.query;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const query = { isPublic: true }; // 공개된 것만

    let sortOptions = { createdAt: -1 }; // 기본 최신순
    // if (sort === 'rating_desc') { sortOptions = { rating: -1, createdAt: -1 }; }

    // populate 추가: 게시글 작성자 + 댓글 작성자 정보
    const feedPhotos = await Photo.find(query)
      .sort(sortOptions)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .populate('owner', 'displayName email') // 게시글 작성자
      .populate('comments.owner', 'displayName email'); // 댓글 작성자

    const totalCount = await Photo.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limitNum);

    res.status(200).json({
      photos: feedPhotos,
      totalPages,
      currentPage: pageNum,
      totalCount
    });

  } catch (error) {
    console.error("공개 피드 조회 오류:", error);
    res.status(500).json({ message: '공개 피드를 불러오는 중 오류 발생', error: error.message });
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

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: '잘못된 사용자 ID 형식입니다.' });
    }

    // populate 추가: 댓글 작성자 정보
    const publicPhotos = await Photo.find({
      owner: userId,
      isPublic: true
    })
    .sort({ createdAt: -1 })
    .populate('owner', 'displayName email') // 게시글 작성자 (원래 있었음)
    .populate('comments.owner', 'displayName email'); // 댓글 작성자

    const profileUser = await User.findById(userId).select('displayName email');

    if (!profileUser) {
        return res.status(404).json({ message: '해당 사용자를 찾을 수 없습니다.' });
    }

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
    const { name, address, rating, memo, tags, visited, isPublic, priceRange } = req.body;
    const imageUrl = req.file ? req.file.location : null;

    if (!imageUrl) { return res.status(400).json({ message: '이미지 파일은 필수입니다.' }); }
    if (!address) { return res.status(400).json({ message: '주소는 필수입니다.' }); }
    const ratingNum = parseInt(rating, 10);
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
        return res.status(400).json({ message: '별점은 1에서 5 사이의 숫자여야 합니다.' });
    }

    let tagsArray = [];
    if (tags) {
        try {
            const parsedTags = JSON.parse(tags);
            if (Array.isArray(parsedTags)) {
                tagsArray = parsedTags.map(tag => String(tag).trim()).filter(tag => tag);
            }
        } catch (e) { console.error('태그 파싱 오류:', e); }
    }

    const newPhoto = new Photo({
      name,
      location: { address: address },
      rating: ratingNum,
      memo,
      imageUrl,
      tags: tagsArray,
      owner: req.user.id,
      visited: visited === 'true',
      isPublic: isPublic === 'true',
      priceRange: priceRange || null,
      comments: [] // 생성 시 빈 댓글 배열 초기화
    });

    await newPhoto.save();
    // 생성 응답 시 populate 불필요 (댓글 아직 없음)
    res.status(201).json(newPhoto);

  } catch (error) {
    console.error("맛집 저장 오류:", error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ message: `데이터 검증 실패: ${messages.join(', ')}` });
    }
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
        const { name, address, rating, memo, tags, visited, isPublic, priceRange } = req.body;
        const photoId = req.params.id;
        const userId = req.user.id;

        const photo = await Photo.findOne({ _id: photoId, owner: userId });
        if (!photo) { return res.status(404).json({ message: '수정할 맛집 기록을 찾을 수 없거나 권한이 없습니다.' }); }

        if (name !== undefined) photo.name = name;
        if (rating !== undefined) {
             const ratingNum = parseInt(rating, 10);
             if (!isNaN(ratingNum) && ratingNum >= 1 && ratingNum <= 5) { photo.rating = ratingNum; }
        }
        if (memo !== undefined) photo.memo = memo;
        if (visited !== undefined) photo.visited = visited === 'true';
        if (isPublic !== undefined) photo.isPublic = isPublic === 'true';
        if (priceRange !== undefined) photo.priceRange = priceRange || null;

        if (address !== undefined && address !== photo.location.address) { photo.location.address = address; }

        if (tags !== undefined) {
          if (tags === '') { photo.tags = []; }
          else {
              try {
                  const parsedTags = JSON.parse(tags);
                   if (Array.isArray(parsedTags)) { photo.tags = parsedTags.map(tag => String(tag).trim()).filter(tag => tag); }
              } catch (e) { console.error('태그 파싱 오류:', e); }
          }
        }

        if (req.file) { photo.imageUrl = req.file.location; }

        const updatedPhoto = await photo.save();
        // 수정 응답 시에도 댓글 정보 populate (프론트에서 즉시 반영 위해)
        await updatedPhoto.populate('comments.owner', 'displayName email');
        res.status(200).json(updatedPhoto);

    } catch (error) {
       console.error("맛집 수정 오류:", error);
       if (error.name === 'ValidationError') {
         const messages = Object.values(error.errors).map(e => e.message);
         return res.status(400).json({ message: `데이터 검증 실패: ${messages.join(', ')}` });
       }
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

    const photo = await Photo.findOneAndDelete({ _id: photoId, owner: userId });
    if (!photo) { return res.status(404).json({ message: '삭제할 맛집 기록을 찾을 수 없거나 권한이 없습니다.' }); }

    // TODO: S3 이미지 삭제

    res.status(200).json({ message: '맛집 기록이 성공적으로 삭제되었습니다.' });
  } catch (error) {
    console.error("맛집 삭제 오류:", error);
    res.status(500).json({ message: '맛집 기록 삭제 중 서버 오류가 발생했습니다.', error: error.message });
  }
});


// ======================================================
// 👇👇👇 댓글 관련 API 👇👇👇
// ======================================================

/**
 * @route   POST /api/photos/:photoId/comments
 * @desc    맛집 기록에 댓글 추가
 * @access  Private (User)
 */
router.post('/:photoId/comments', auth, async (req, res) => {
    try {
        const { text } = req.body;
        const photoId = req.params.photoId;
        const userId = req.user.id; // 댓글 작성자 ID

        if (!text || text.trim() === '') {
            return res.status(400).json({ message: '댓글 내용이 필요합니다.' });
        }
        if (!mongoose.Types.ObjectId.isValid(photoId)) {
            return res.status(400).json({ message: '잘못된 맛집 ID 형식입니다.' });
        }

        const photo = await Photo.findById(photoId);
        if (!photo) {
            return res.status(404).json({ message: '댓글을 추가할 맛집 기록을 찾을 수 없습니다.' });
        }

        // 새 댓글 객체 생성
        const newComment = {
            text: text.trim(),
            owner: userId,
        };

        // photo 문서의 comments 배열에 새 댓글 추가 (배열 맨 앞에 추가 - 최신 댓글 위로)
        photo.comments.unshift(newComment);
        await photo.save(); // 변경사항 저장

        // 저장 후 photo 객체에는 ObjectId만 들어있으므로,
        // User 모델을 사용하여 작성자 정보를 직접 가져와 합쳐서 반환합니다.
        const ownerInfo = await User.findById(userId).select('displayName email').lean(); // lean() 추가
        // 저장된 댓글 객체 (_id 포함) 와 ownerInfo를 합쳐서 응답 생성
        const populatedComment = {
            ...photo.comments[0].toObject(), // toObject()로 Mongoose 문서 -> 일반 객체 변환
            owner: ownerInfo // populate 대신 직접 합침
        };

        res.status(201).json(populatedComment); // 생성된 댓글 객체 반환

    } catch (error) {
        console.error("댓글 추가 오류:", error);
        res.status(500).json({ message: '댓글 추가 중 서버 오류 발생', error: error.message });
    }
});


/**
 * @route   DELETE /api/photos/:photoId/comments/:commentId
 * @desc    맛집 기록에서 특정 댓글 삭제
 * @access  Private (Comment Owner or Admin - 관리자 삭제 기능은 추가 구현 필요)
 */
router.delete('/:photoId/comments/:commentId', auth, async (req, res) => {
    try {
        const { photoId, commentId } = req.params;
        const userId = req.user.id; // 현재 로그인한 사용자 ID

        if (!mongoose.Types.ObjectId.isValid(photoId) || !mongoose.Types.ObjectId.isValid(commentId)) {
            return res.status(400).json({ message: '잘못된 ID 형식입니다.' });
        }

        const photo = await Photo.findById(photoId);
        if (!photo) {
            return res.status(404).json({ message: '맛집 기록을 찾을 수 없습니다.' });
        }

        // 삭제할 댓글 찾기
        const comment = photo.comments.id(commentId); // Mongoose subdocument id 검색
        if (!comment) {
            return res.status(404).json({ message: '삭제할 댓글을 찾을 수 없습니다.' });
        }

        // 댓글 소유권 확인 (본인 댓글만 삭제 가능)
        // TODO: 관리자도 삭제 가능하게 하려면 여기에 req.user.role === 'admin' 조건 추가
        if (comment.owner.toString() !== userId) {
            return res.status(403).json({ message: '댓글을 삭제할 권한이 없습니다.' });
        }

        // 댓글 삭제 (Mongoose 5.x 이상 pull 사용 방식)
        photo.comments.pull({ _id: commentId }); // 배열에서 해당 _id를 가진 요소 제거
        await photo.save(); // 변경사항 저장

        res.status(200).json({ message: '댓글이 삭제되었습니다.' });

    } catch (error) {
        console.error("댓글 삭제 오류:", error);
        res.status(500).json({ message: '댓글 삭제 중 서버 오류 발생', error: error.message });
    }
});

/**
 * @route   PUT /api/photos/:photoId/comments/:commentId
 * @desc    맛집 기록에서 특정 댓글 수정
 * @access  Private (Comment Owner)
 */
router.put('/:photoId/comments/:commentId', auth, async (req, res) => {
    try {
        const { text } = req.body; // 수정할 댓글 내용
        const { photoId, commentId } = req.params;
        const userId = req.user.id; // 현재 로그인한 사용자 ID

        if (!text || text.trim() === '') {
            return res.status(400).json({ message: '댓글 내용이 필요합니다.' });
        }
        if (!mongoose.Types.ObjectId.isValid(photoId) || !mongoose.Types.ObjectId.isValid(commentId)) {
            return res.status(400).json({ message: '잘못된 ID 형식입니다.' });
        }

        // Photo 문서를 찾고, 그 안의 특정 commentId를 가진 댓글을 직접 업데이트 (효율적)
        const photo = await Photo.findOneAndUpdate(
            { "_id": photoId, "comments._id": commentId, "comments.owner": userId }, // 조건: 맛집ID, 댓글ID, 댓글 소유자 일치
            { "$set": { "comments.$.text": text.trim() } }, // 업데이트할 내용: comments 배열 중 조건에 맞는 요소($)의 text 필드
            { new: true } // 업데이트된 문서 반환
        ).populate('comments.owner', 'displayName email'); // 업데이트 후 댓글 작성자 정보 포함

        if (!photo) {
            // photo가 없거나, 댓글이 없거나, 댓글 소유자가 아니면 null 반환됨
            return res.status(404).json({ message: '수정할 댓글을 찾을 수 없거나 권한이 없습니다.' });
        }

        // 수정된 댓글 정보 찾기 (photo.comments 배열에서 commentId로 다시 찾기)
        const updatedComment = photo.comments.find(c => c._id.toString() === commentId);

        res.status(200).json(updatedComment); // 수정된 댓글 객체 반환

    } catch (error) {
        console.error("댓글 수정 오류:", error);
        res.status(500).json({ message: '댓글 수정 중 서버 오류 발생', error: error.message });
    }
});


module.exports = router;

