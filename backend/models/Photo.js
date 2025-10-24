const mongoose = require('mongoose');

// 가격대 옵션 정의
const PRICE_RANGE_OPTIONS = ['₩', '₩₩', '₩₩₩', '₩₩₩₩']; // 예: 만원 이하, 1-3만원, 3-5만원, 5만원 이상

// --- 댓글 스키마 정의 ---
const commentSchema = new mongoose.Schema({
  text: { // 댓글 내용
    type: String,
    required: true,
    trim: true,
  },
  owner: { // 댓글 작성자
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User', // User 모델과 연결
  },
  createdAt: { // 댓글 작성 시간
    type: Date,
    default: Date.now,
  },
});


// --- 맛집(Photo) 스키마 정의 ---
const photoSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, '맛집 이름은 필수입니다.'], // 에러 메시지 추가
    trim: true,
  },
  memo: {
    type: String,
    trim: true,
  },
  location: {
    address: {
      type: String,
      required: [true, '주소는 필수입니다.'],
      trim: true
    }
    // lat, lng 필드는 제거됨
  },
  rating: {
    type: Number,
    required: [true, '별점은 필수입니다.'],
    min: [1, '별점은 1 이상이어야 합니다.'],
    max: [5, '별점은 5 이하이어야 합니다.'],
  },
  imageUrl: {
    type: String,
    required: [true, '이미지 URL은 필수입니다.'],
  },
  owner: { // 맛집 기록 작성자
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  tags: [{ // 태그 배열
    type: String,
    trim: true
  }],
  visited: { // 방문 여부 (true: 방문함, false: 가고싶은 곳)
    type: Boolean,
    default: true,
  },
  isPublic: { // 공개 여부
    type: Boolean,
    default: false,
  },
  priceRange: { // 가격대
    type: String,
    enum: {
        values: PRICE_RANGE_OPTIONS,
        message: '유효한 가격대 옵션이 아닙니다.' // enum 유효성 검사 메시지
    },
    trim: true,
  },
  // --- 댓글 필드 추가 ---
  comments: [commentSchema], // 댓글 스키마를 배열 형태로 포함

}, { timestamps: true }); // createdAt, updatedAt 자동 생성

// --- 인덱스 추가 (검색 성능 향상) ---
photoSchema.index({ tags: 1 }); // 태그 검색
photoSchema.index({ 'location.address': 'text', name: 'text', memo: 'text' }); // 텍스트 검색
photoSchema.index({ owner: 1, visited: 1 }); // 사용자별 방문 여부 필터링
photoSchema.index({ owner: 1, isPublic: 1 }); // 사용자별 공개 여부 필터링
photoSchema.index({ "comments.createdAt": 1 }); // 댓글 생성 시간 기준 정렬 (선택 사항)


module.exports = mongoose.model('Photo', photoSchema);

