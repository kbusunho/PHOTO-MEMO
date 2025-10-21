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
  // 👇👇👇 이 부분이 가장 중요합니다! 'location'을 객체로 수정합니다. 👇👇👇
  location: {
    address: { 
      type: String,
      required: true,
      trim: true
    }
    // lat, lng 필드는 이제 없습니다.
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
  tags: [{
    type: String,
    trim: true
  }]
}, { timestamps: true });

photoSchema.index({ tags: 1 });
photoSchema.index({ 'location.address': 'text' }); // 주소 텍스트 검색을 위한 인덱스

module.exports = mongoose.model('Photo', photoSchema);