const mongoose = require('mongoose');

const photoSchema = new mongoose.Schema({
  // title -> name 으로 변경
  name: {
    type: String,
    required: true,
    trim: true,
  },
  // description -> memo 로 변경
  memo: {
    type: String,
    trim: true,
  },
  // 맛집 위치와 별점 필드 추가
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
}, { timestamps: true });

module.exports = mongoose.model('Photo', photoSchema);