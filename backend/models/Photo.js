const mongoose = require('mongoose');

const photoSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  memo: {
    type: String,
    trim: true,
  },
  location: {
    type: String,
    required: true,
    trim: true,
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  imageUrl: {
    type: String,
    required: true,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  // 👇👇👇 이 필드가 새로 추가되었습니다! 👇👇👇
  tags: [{
    type: String,
    trim: true
  }]
}, { timestamps: true });

// 태그 검색을 위한 인덱스 추가
photoSchema.index({ tags: 1 });

// (선택 사항) 텍스트 검색을 위한 인덱스.
// $regex를 사용할 거라 필수는 아니지만, 데이터가 많아지면 성능에 좋습니다.
// photoSchema.index({ name: 'text', location: 'text', memo: 'text' });

module.exports = mongoose.model('Photo', photoSchema);