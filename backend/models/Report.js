const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
    // 신고한 사용자
    reporter: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User' // User 모델과 연결
    },
    // 신고 대상 타입 ('Photo' 또는 'Comment')
    targetType: {
        type: String,
        required: true,
        enum: ['Photo', 'Comment']
    },
    // 신고 대상의 ID (Photo._id 또는 Comment._id)
    targetId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    // 신고 대상 댓글이 포함된 Photo 문서의 ID (댓글 신고 시에도 필요)
    targetPhotoId: {
       type: mongoose.Schema.Types.ObjectId,
       ref: 'Photo', // Photo 모델과 연결
       required: true
    },
    // 신고 사유 (사용자가 입력)
    reason: {
        type: String,
        required: [true, '신고 사유는 필수입니다.'],
        trim: true,
        minlength: [5, '신고 사유는 5자 이상 입력해주세요.'], // 최소 길이 제한
        maxlength: [500, '신고 사유는 500자를 넘을 수 없습니다.'] // 최대 길이 제한
    },
    // 신고 처리 상태
    status: {
        type: String,
        required: true,
        enum: ['Pending', 'Resolved', 'Dismissed'], // 대기중, 처리됨(조치됨), 기각됨(문제없음)
        default: 'Pending' // 기본값은 '대기중'
    },
    // 신고를 처리한 관리자 (선택 사항)
    resolvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User' // User 모델과 연결
    },
    // 신고 처리 일시 (선택 사항)
    resolvedAt: {
        type: Date
    }
}, { timestamps: true }); // 신고 접수 시간 (createdAt) 및 업데이트 시간 (updatedAt) 자동 생성

// 인덱스 추가 (관리자 패널에서 신고 목록 조회 성능 향상)
reportSchema.index({ status: 1, createdAt: -1 }); // 상태별 최신순 조회
reportSchema.index({ targetPhotoId: 1 }); // 특정 게시글 관련 신고 조회

module.exports = mongoose.model('Report', reportSchema);

