const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// 👇 1. 전화번호 정규식 (선택 사항 - 간단한 형식만 체크)
const PHONE_REGEX = /^\d{2,3}-\d{3,4}-\d{4}$/; 

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
        match: [EMAIL_REGEX, "유효한 이메일 형식이어야 합니다."]
    },
    passwordHash: {
        type: String,
        required: true
    },
    displayName: {
        type: String,
        trim: true,
        default: ""
    },
    // 👇 2. phoneNumber 필드 추가
    phoneNumber: {
        type: String,
        trim: true,
        // match: [PHONE_REGEX, "유효한 전화번호 형식(예: 010-1234-5678)이어야 합니다."] // 필요시 주석 해제
    },
    role: {
        type: String,
        enum: ["user", "admin"],
        default: "user",
        index: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isLoggined: { // 오타 수정: isLoggined -> isLoggedIn
        type: Boolean,
        default: false
    },
    loginAttempts: {
        type: Number,
        default: 0
    },
    lastLoginAt: { // lastLoginAt 필드 추가 (로그인 시 업데이트)
       type: Date 
    }
}, {
    timestamps: true
});

userSchema.methods.comparePassword = function(plain) {
    return bcrypt.compare(plain, this.passwordHash);
};

userSchema.methods.toSafeJSON = function() {
    const obj = this.toObject({ versionKey: false });
    delete obj.passwordHash; // 비밀번호 해시는 절대 반환하지 않음
    return obj;
};
userSchema.index({ email: 1 }, { unique: true });

module.exports = mongoose.model('User', userSchema);