const mongoose = require('mongoose');

// 가격대 옵션 정의
const PRICE_RANGE_OPTIONS = ['₩', '₩₩', '₩₩₩', '₩₩₩₩']; // 예: 만원 이하, 1-3만원, 3-5만원, 5만원 이상

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
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  tags: [{
    type: String,
    trim: true
  }],
  // --- 새 필드들 ---
  visited: { // 방문 여부 (true: 방문함, false: 가고싶은 곳)
    type: Boolean,
    default: true, // 기본값은 '방문함'
  },
  isPublic: { // 공개 여부
    type: Boolean,
    default: false, // 기본값은 '비공개'
  },
  priceRange: { // 가격대
    type: String,
    enum: {
        values: PRICE_RANGE_OPTIONS,
        message: '유효한 가격대 옵션이 아닙니다.' // enum 유효성 검사 메시지
    },
    trim: true,
  }
}, { timestamps: true });

// 인덱스 추가 (검색 성능 향상)
photoSchema.index({ tags: 1 });
photoSchema.index({ 'location.address': 'text', name: 'text', memo: 'text' }); // 텍스트 검색용
photoSchema.index({ owner: 1, visited: 1 }); // 사용자별 방문 여부 필터링용
photoSchema.index({ owner: 1, isPublic: 1 }); // 사용자별 공개 여부 필터링용

module.exports = mongoose.model('Photo', photoSchema);

