const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth'); // 로그인 확인 미들웨어
const upload = require('../middlewares/upload'); // 파일 업로드 미들웨어
const Photo = require('../models/Photo'); // 맛집 모델
const User = require('../models/User'); // User 모델 (프로필 정보 및 댓글 populate 용)
const Report = require('../models/Report'); // Report 모델 임포트
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
      page = 1,
      limit = 12,
      search,
      sort,
      tag,
      visited,
      priceRange
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
      case 'visitedDate_desc': sortOptions = { visitedDate: -1, createdAt: -1 }; break;
      case 'visitedDate_asc':  sortOptions = { visitedDate: 1, createdAt: -1 }; break;
      // 'likes_desc'는 아래에서 별도 처리
    }

    let photos = [];
    let totalCount = 0;
    
    // --- 데이터베이스 조회 (정렬 및 페이지네이션) ---
    if (sort === 'likes_desc') {
        // 좋아요 순 정렬 (Aggregate 사용)
        const aggregationPipeline = [
            { $match: query }, // 1. 필터링
            { $addFields: { likeCount: { $size: "$likes" } } }, // 2. likeCount 필드 동적 추가
            { $sort: { likeCount: -1, createdAt: -1 } }, // 3. 정렬
            { $skip: (pageNum - 1) * limitNum }, // 4. 페이지네이션
            { $limit: limitNum }
        ];
        
        const aggregatedPhotos = await Photo.aggregate(aggregationPipeline);
        // Aggregate 결과는 Mongoose 문서가 아니므로, ID로 다시 조회하여 Mongoose 문서로 변환 (populate 위함)
        const photoIds = aggregatedPhotos.map(p => p._id);
        
        // $in 쿼리는 순서를 보장하지 않으므로, populate 후 수동 정렬 필요
        const populatedPhotos = await Photo.find({ _id: { $in: photoIds } })
            .populate('owner', 'displayName email')
            .populate('comments.owner', 'displayName email');
        
        // photoIds 순서대로 정렬
        photos = photoIds.map(id => populatedPhotos.find(p => p._id.equals(id))).filter(Boolean);

    } else {
        // 일반 정렬
        photos = await Photo.find(query)
          .sort(sortOptions)
          .skip((pageNum - 1) * limitNum)
          .limit(limitNum)
          .populate('owner', 'displayName email') // 게시글 작성자 정보
          .populate('comments.owner', 'displayName email'); // 댓글 작성자 정보
    }

    // --- 총 개수 및 페이지 계산 ---
    totalCount = await Photo.countDocuments(query); // 필터링된 총 항목 수
    const totalPages = Math.ceil(totalCount / limitNum); // 총 페이지 수

    // --- '좋아요' 상태 추가 ---
    const photosWithLikeStatus = photos.map(photo => ({
      ...photo.toObject({ virtuals: true }), // 가상 필드(likeCount, commentCount) 포함
      isLikedByCurrentUser: photo.likes.some(likeUserId => likeUserId.equals(req.user.id))
    }));

    // --- 응답 전송 ---
    res.status(200).json({
      photos: photosWithLikeStatus,
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
    const { page = 1, limit = 12, sort = 'createdAt_desc' } = req.query;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const query = { isPublic: true };
    let sortOptions = { createdAt: -1 };
    // TODO: 피드에서도 'likes_desc' 정렬 구현 (위 / 라우트 aggregate 방식 참고)

    const feedPhotos = await Photo.find(query)
      .sort(sortOptions)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .populate('owner', 'displayName email')
      .populate('comments.owner', 'displayName email');

    const totalCount = await Photo.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limitNum);

    // 피드에서도 '좋아요' 상태 추가
    const photosWithLikeStatus = feedPhotos.map(photo => ({
        ...photo.toObject({ virtuals: true }),
        isLikedByCurrentUser: photo.likes.some(likeUserId => likeUserId.equals(req.user.id))
    }));

    res.status(200).json({
      photos: photosWithLikeStatus,
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
 * @desc    특정 사용자의 공개된 맛집 목록 조회 (로그인 필요)
 * @access  Private (User) - 로그인한 사용자기준 '좋아요' 표시 위해 auth 추가
 */
router.get('/public/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: '잘못된 사용자 ID 형식입니다.' });
    }

    const publicPhotos = await Photo.find({ owner: userId, isPublic: true })
      .sort({ createdAt: -1 })
      .populate('owner', 'displayName email')
      .populate('comments.owner', 'displayName email');

    const profileUser = await User.findById(userId).select('displayName email');
    if (!profileUser) {
        return res.status(404).json({ message: '해당 사용자를 찾을 수 없습니다.' });
    }

    // '좋아요' 상태 추가 (로그인한 사용자기준)
    const photosWithLikeStatus = publicPhotos.map(photo => ({
        ...photo.toObject({ virtuals: true }),
        isLikedByCurrentUser: photo.likes.some(likeUserId => likeUserId.equals(req.user.id)) 
    }));

    res.status(200).json({ photos: photosWithLikeStatus, user: profileUser });

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
    const { name, address, rating, memo, tags, visited, isPublic, priceRange, visitedDate } = req.body;
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
      comments: [],
      likes: [],
      visitedDate: visitedDate ? new Date(visitedDate) : null
    });

    await newPhoto.save();
    res.status(201).json(newPhoto.toObject({ virtuals: true }));

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
        const { name, address, rating, memo, tags, visited, isPublic, priceRange, visitedDate } = req.body;
        const photoId = req.params.id;
        const userId = req.user.id;

        const photo = await Photo.findOne({ _id: photoId, owner: userId });
        if (!photo) { return res.status(404).json({ message: '수정할 맛집 기록을 찾을 수 없거나 권한이 없습니다.' }); }

        // --- 필드 업데이트 ---
        if (name !== undefined) photo.name = name;
        if (rating !== undefined) {
             const ratingNum = parseInt(rating, 10);
             if (!isNaN(ratingNum) && ratingNum >= 1 && ratingNum <= 5) { photo.rating = ratingNum; }
        }
        if (memo !== undefined) photo.memo = memo;
        if (visited !== undefined) photo.visited = visited === 'true';
        if (isPublic !== undefined) photo.isPublic = isPublic === 'true';
        if (priceRange !== undefined) photo.priceRange = priceRange || null;
        if (visitedDate !== undefined) {
           photo.visitedDate = visitedDate ? new Date(visitedDate) : null;
        }
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
        
        await updatedPhoto.populate([
            { path: 'owner', select: 'displayName email' },
            { path: 'comments.owner', select: 'displayName email' }
        ]);

        const photoWithLikeStatus = {
            ...updatedPhoto.toObject({ virtuals: true }),
            isLikedByCurrentUser: updatedPhoto.likes.some(likeUserId => likeUserId.equals(req.user.id))
        };
        res.status(200).json(photoWithLikeStatus);

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
    await Report.deleteMany({ targetPhotoId: photoId }); // 관련 신고 내역 삭제

    res.status(200).json({ message: '맛집 기록이 성공적으로 삭제되었습니다.' });
  } catch (error) {
    console.error("맛집 삭제 오류:", error);
    res.status(500).json({ message: '맛집 기록 삭제 중 서버 오류가 발생했습니다.', error: error.message });
  }
});


// ======================================================
// 👇👇👇 좋아요 관련 API 👇👇👇
// ======================================================
/**
 * @route   POST /api/photos/:photoId/like
 * @desc    맛집 기록에 '좋아요' 추가/취소 (토글)
 * @access  Private (User)
 */
router.post('/:photoId/like', auth, async (req, res) => {
    try {
        const photoId = req.params.photoId;
        const userId = req.user.id;

        if (!mongoose.Types.ObjectId.isValid(photoId)) {
            return res.status(400).json({ message: '잘못된 맛집 ID 형식입니다.' });
        }

        const photo = await Photo.findById(photoId);
        if (!photo) {
            return res.status(404).json({ message: '좋아요할 맛집 기록을 찾을 수 없습니다.' });
        }

        const likeIndex = photo.likes.findIndex(likeUserId => likeUserId.equals(userId));
        let isLikedByCurrentUser;

        if (likeIndex > -1) {
            // 이미 눌렀으면 -> 좋아요 취소 ($pull)
            photo.likes.pull(userId);
            isLikedByCurrentUser = false;
        } else {
            // 누르지 않았으면 -> 좋아요 추가 ($addToSet 방식)
            photo.likes.push(userId);
            isLikedByCurrentUser = true;
        }

        await photo.save();

        res.status(200).json({ 
            likeCount: photo.likes.length, 
            isLikedByCurrentUser 
        });

    } catch (error) {
        console.error("좋아요 처리 오류:", error);
        res.status(500).json({ message: '좋아요 처리 중 오류 발생', error: error.message });
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
        const userId = req.user.id;

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

        const newComment = {
            text: text.trim(),
            owner: userId,
        };

        photo.comments.unshift(newComment); // 맨 앞에 추가
        await photo.save();

        // ** (오류 수정) **
        // 저장된 댓글(배열의 첫번째 요소) 가져오기
        const savedComment = photo.comments[0];
        // 댓글 작성자 정보 populate
        // lean()을 사용하여 Mongoose 문서가 아닌 일반 JS 객체로 가져옴
        const ownerInfo = await User.findById(userId).select('displayName email').lean(); 
        
        // Mongoose 문서를 일반 객체로 변환하고 owner 정보 수동 할당
        const populatedComment = {
            ...savedComment.toObject(),
            owner: ownerInfo 
        };

        res.status(201).json(populatedComment);

    } catch (error) {
        console.error("댓글 추가 오류:", error);
        res.status(500).json({ message: '댓글 추가 중 서버 오류 발생', error: error.message });
    }
});


/**
 * @route   DELETE /api/photos/:photoId/comments/:commentId
 * @desc    맛집 기록에서 특정 댓글 삭제
 * @access  Private (Comment Owner or Admin)
 */
router.delete('/:photoId/comments/:commentId', auth, async (req, res) => {
    try {
        const { photoId, commentId } = req.params;
        const userId = req.user.id;
        const userRole = req.user.role; // 관리자 확인용

        if (!mongoose.Types.ObjectId.isValid(photoId) || !mongoose.Types.ObjectId.isValid(commentId)) {
             return res.status(400).json({ message: '잘못된 ID 형식입니다.' });
        }

        const photo = await Photo.findById(photoId);
        if (!photo) {
            return res.status(404).json({ message: '맛집 기록을 찾을 수 없습니다.' });
        }

        const comment = photo.comments.id(commentId);
        if (!comment) {
            return res.status(404).json({ message: '삭제할 댓글을 찾을 수 없습니다.' });
        }

        // 권한 확인 (본인이거나 관리자)
        if (comment.owner.toString() !== userId && userRole !== 'admin') {
            return res.status(403).json({ message: '댓글을 삭제할 권한이 없습니다.' });
        }

        photo.comments.pull({ _id: commentId });
        await photo.save();
        
        await Report.deleteMany({ targetType: 'Comment', targetId: commentId });

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
        const { text } = req.body;
        const { photoId, commentId } = req.params;
        const userId = req.user.id;

        if (!text || text.trim() === '') {
            return res.status(400).json({ message: '댓글 내용이 필요합니다.' });
        }
        if (!mongoose.Types.ObjectId.isValid(photoId) || !mongoose.Types.ObjectId.isValid(commentId)) {
            return res.status(400).json({ message: '잘못된 ID 형식입니다.' });
        }

        // Mongoose 쿼리를 사용하여 댓글 직접 수정 (더 효율적)
        const updatedPhoto = await Photo.findOneAndUpdate(
            { "_id": photoId, "comments._id": commentId, "comments.owner": userId },
            { 
                "$set": { 
                    "comments.$.text": text.trim(),
                    "comments.$.updatedAt": new Date() // 수정 시간 갱신 (스키마에 updatedAt이 있다면)
                }
            },
            { new: true } // 업데이트된 문서 반환
        ).populate('comments.owner', 'displayName email');

        if (!updatedPhoto) {
            return res.status(404).json({ message: '수정할 댓글을 찾을 수 없거나 권한이 없습니다.' });
        }

        // 수정된 댓글 정보 찾기
        const updatedComment = updatedPhoto.comments.find(c => c._id.toString() === commentId);

        res.status(200).json(updatedComment); // 수정된 댓글 객체 반환

    } catch (error) {
        console.error("댓글 수정 오류:", error);
        res.status(500).json({ message: '댓글 수정 중 서버 오류 발생', error: error.message });
    }
});


// ======================================================
// 👇👇👇 신고 관련 API 👇👇👇
// ======================================================
/**
 * @route   POST /api/photos/report
 * @desc    맛집 기록 또는 댓글 신고
 * @access  Private (User)
 */
router.post('/report', auth, async (req, res) => {
    try {
        const { targetType, targetId, targetPhotoId, reason } = req.body;
        const reporterId = req.user.id;

        if (!targetType || !targetId || !targetPhotoId || !reason) {
            return res.status(400).json({ message: '신고 정보(대상 타입, ID, 게시글 ID, 사유)가 모두 필요합니다.' });
        }
        if (!['Photo', 'Comment'].includes(targetType)) {
            return res.status(400).json({ message: '잘못된 신고 대상 타입입니다.' });
        }
        if (!mongoose.Types.ObjectId.isValid(targetId) || !mongoose.Types.ObjectId.isValid(targetPhotoId)) {
            return res.status(400).json({ message: '잘못된 ID 형식입니다.' });
        }

        // 신고 대상 존재 확인
        const photoExists = await Photo.findById(targetPhotoId);
        if (!photoExists) {
             return res.status(404).json({ message: '신고 대상 게시글을 찾을 수 없습니다.' });
        }
        if (targetType === 'Comment') {
            const commentExists = photoExists.comments.id(targetId);
            if (!commentExists) {
                return res.status(404).json({ message: '신고 대상 댓글을 찾을 수 없습니다.' });
            }
        }

        // 중복 신고 확인
        const existingReport = await Report.findOne({ reporter: reporterId, targetType, targetId });
        if (existingReport) {
            return res.status(400).json({ message: '이미 신고하신 내용입니다.' });
        }

        // 새 신고 생성
        const newReport = new Report({
            reporter: reporterId,
            targetType,
            targetId,
            targetPhotoId,
            reason: reason.trim()
        });

        await newReport.save();
        res.status(201).json({ message: '신고가 접수되었습니다.' });

    } catch (error) {
        console.error("신고 접수 오류:", error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(e => e.message);
            return res.status(400).json({ message: `신고 실패: ${messages.join(', ')}` });
        }
        res.status(500).json({ message: '신고 처리 중 서버 오류 발생', error: error.message });
    }
});

module.exports = router;

