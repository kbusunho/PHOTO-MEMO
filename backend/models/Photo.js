const mongoose = require('mongoose');
const User = require('./User'); // User 모델 임포트 (populate 확인용)

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
  // createdAt, updatedAt은 { timestamps: true } 옵션으로 자동 추가됨
  // 👇 댓글 신고 정보 (선택적: 댓글 자체에 신고 정보 저장 방식)
  // reports: [{ reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, reason: String, reportedAt: { type: Date, default: Date.now } }]
}, { timestamps: true }); // createdAt, updatedAt 자동 추가


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
  // --- 댓글 필드 ---
  comments: [commentSchema], // 댓글 스키마를 배열 형태로 포함

  // --- 추가된 필드 ---
  likes: [{ // '좋아요' 누른 사용자 ID 배열
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  visitedDate: { // 방문 날짜
    type: Date,
  },
  // --- 신고 필드 (별도 Report 모델 사용 권장) ---
  // reports: [{ reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, reason: String, reportedAt: { type: Date, default: Date.now } }]

}, { timestamps: true }); // createdAt, updatedAt 자동 생성


// --- 가상 필드 (Virtuals) ---
// '좋아요' 개수를 쉽게 가져오기 위한 가상 필드
photoSchema.virtual('likeCount').get(function() {
  // this.likes가 배열인지 확인 후 length 반환
  return Array.isArray(this.likes) ? this.likes.length : 0;
});
// 댓글 개수를 쉽게 가져오기 위한 가상 필드
photoSchema.virtual('commentCount').get(function() {
    // this.comments가 배열인지 확인 후 length 반환
    return Array.isArray(this.comments) ? this.comments.length : 0;
});


// --- 인덱스 추가 (검색 성능 향상) ---
photoSchema.index({ tags: 1 }); // 태그 검색
photoSchema.index({ 'location.address': 1, name: 1, memo: 1 }); // 텍스트 검색 (개별 필드 인덱스 권장)
// photoSchema.index({ '$**': 'text' }); // 모든 문자열 필드 텍스트 인덱싱 (단순하지만 덜 효율적)
photoSchema.index({ owner: 1, visited: 1 }); // 사용자별 방문 여부 필터링
photoSchema.index({ owner: 1, isPublic: 1 }); // 사용자별 공개 여부 필터링
photoSchema.index({ isPublic: 1, createdAt: -1 }); // 공개 피드 정렬
photoSchema.index({ likes: -1 }); // 인기순 정렬 (배열 필드 인덱스는 제한적)
photoSchema.index({ visitedDate: -1 }); // 방문 날짜순 정렬
photoSchema.index({ "comments.createdAt": 1 }); // 댓글 생성 시간 기준 정렬 (선택 사항)


// --- 설정 ---
// JSON 및 객체 변환 시 가상 필드 포함
photoSchema.set('toJSON', { virtuals: true });
photoSchema.set('toObject', { virtuals: true });


module.exports = mongoose.model('Photo', photoSchema);

