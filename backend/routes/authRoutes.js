const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const User = require("../models/User");
const auth = require('../middlewares/auth'); // auth 미들웨어 임포트 (비밀번호 변경, /me 에 필요)

// JWT 토큰 생성 함수
function makeToken(user) {
    return jwt.sign(
        {
            id: user._id.toString(),
            role: user.role,
            email: user.email
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "7d" // 토큰 유효기간 7일
        }
    );
}

// POST /api/auth/register - 회원가입
router.post("/register", async (req, res) => {
    try {
        // phoneNumber 받기 추가됨
        const { email, password, displayName, role, phoneNumber } = req.body;

        // 필수 값 검증
        if (!email || !password) {
            return res.status(400).json({ message: "이메일과 비밀번호는 필수입니다." });
        }

        // 이메일 중복 확인
        const exists = await User.findOne({ email: email.toLowerCase() });
        if (exists) {
            return res.status(400).json({ message: "이미 가입된 이메일입니다." });
        }

        // 비밀번호 해싱
        const passwordHash = await bcrypt.hash(password, 10);

        // 역할(role) 설정 (기본값 'user')
        const validRoles = ["user", "admin"];
        const safeRole = validRoles.includes(role) ? role : "user";

        // 사용자 생성
        const user = await User.create({
            email: email.toLowerCase(), // 이메일은 소문자로 저장
            displayName: displayName || "",
            passwordHash,
            role: safeRole,
            phoneNumber: phoneNumber || "" // phoneNumber 저장 추가됨
        });

        // 성공 응답 (비밀번호 제외)
        res.status(201).json({ user: user.toSafeJSON() });

    } catch (error) {
        // Mongoose Validation Error 처리
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(e => e.message);
            return res.status(400).json({ message: `회원가입 실패: ${messages.join(', ')}` });
        }
        // 기타 서버 오류
        console.error("회원가입 오류:", error);
        return res.status(500).json({
            message: "회원가입 중 서버 오류가 발생했습니다.",
            error: error.message
        });
    }
});

// POST /api/auth/login - 로그인
const LOCK_MAX = 5; // 로그인 실패 최대 횟수
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        // 이메일로 활성 사용자 찾기
        const user = await User.findOne({
            email: email.toLowerCase(),
            isActive: true // 비활성(잠금) 계정은 제외
        });

        const invalidMsg = { message: "이메일 또는 비밀번호가 올바르지 않습니다." };

        // 사용자가 없거나 비활성 상태
        if (!user) {
            return res.status(400).json({
                ...invalidMsg,
                loginAttempts: null,
                remainingAttempts: null,
                locked: false
            });
        }

        // 비밀번호 검증
        const ok = await user.comparePassword(password);

        // 비밀번호 불일치
        if (!ok) {
            user.loginAttempts += 1;
            const remaining = Math.max(0, LOCK_MAX - user.loginAttempts);

            // 실패 횟수 초과 시 계정 잠금
            if (user.loginAttempts >= LOCK_MAX) {
                user.isActive = false; // 계정 비활성화
                await user.save();
                return res.status(423).json({ // 423 Locked
                    message: "로그인 실패 횟수 초과로 계정이 잠겼습니다. 관리자에게 문의하세요.",
                    loginAttempts: user.loginAttempts,
                    remainingAttempts: 0,
                    locked: true
                });
            }

            // 아직 잠금 전이면 남은 횟수 안내
            await user.save();
            return res.status(400).json({
                ...invalidMsg,
                loginAttempts: user.loginAttempts,
                remainingAttempts: remaining,
                locked: false
            });
        }

        // 로그인 성공: 실패 카운트 초기화 및 로그인 상태 업데이트
        user.loginAttempts = 0;
        user.isLoggedIn = true; // isLoggedIn 상태 업데이트
        user.lastLoginAt = new Date(); // 마지막 로그인 시간 기록
        await user.save();

        // JWT 토큰 발급
        const token = makeToken(user);

        // 성공 응답 (사용자 정보 + 토큰)
        return res.status(200).json({
            user: user.toSafeJSON(),
            token,
            loginAttempts: 0,
            remainingAttempts: LOCK_MAX,
            locked: false
        });

    } catch (error) {
        console.error("로그인 오류:", error);
        return res.status(500).json({
            message: "로그인 중 서버 오류가 발생했습니다.",
            error: error.message
        });
    }
});

// GET /api/auth/me - 내 정보 확인 (토큰 기반)
// auth 미들웨어를 적용합니다.
router.get("/me", auth, async (req, res) => {
    try {
        // auth 미들웨어에서 검증 후 req.user.id에 사용자 ID를 넣어줍니다.
        const user = await User.findById(req.user.id);

        if (!user || !user.isActive) { // 사용자가 없거나 비활성 상태면 404
            return res.status(404).json({ message: "사용자를 찾을 수 없거나 비활성 상태입니다." });
        }

        // 성공 응답 (비밀번호 제외)
        res.status(200).json(user.toSafeJSON());

    } catch (error) {
        // auth 미들웨어에서 토큰 관련 에러는 이미 처리했을 수 있습니다.
        // 여기서는 주로 DB 조회 실패 등 다른 오류를 처리합니다.
        console.error("/me 오류:", error);
        res.status(500).json({ message: "내 정보 조회 중 서버 오류가 발생했습니다.", error: error.message });
    }
});


// ======================================================
// 👇👇👇 비밀번호 변경 API 추가됨 👇👇👇
// ======================================================
/**
 * @route   PUT /api/auth/change-password
 * @desc    로그인한 사용자의 비밀번호 변경
 * @access  Private (User - 본인만 가능, auth 미들웨어 필요)
 */
router.put('/change-password', auth, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user.id; // auth 미들웨어에서 가져온 사용자 ID

        // 입력값 검증
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: '현재 비밀번호와 새 비밀번호를 모두 입력해야 합니다.' });
        }
        if (newPassword.length < 6) { // (선택 사항) 최소 길이 검증
             return res.status(400).json({ message: '새 비밀번호는 6자 이상이어야 합니다.' });
        }

        // DB에서 사용자 찾기 (비밀번호 해시 포함하여 조회)
        const user = await User.findById(userId);
        if (!user || !user.isActive) {
            return res.status(404).json({ message: '사용자를 찾을 수 없거나 비활성 상태입니다.' });
        }

        // 1. 현재 비밀번호 확인
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(400).json({ message: '현재 비밀번호가 일치하지 않습니다.' });
        }

        // 2. 새 비밀번호 해싱
        const newPasswordHash = await bcrypt.hash(newPassword, 10);

        // 3. DB에 새 비밀번호 해시 저장
        user.passwordHash = newPasswordHash;
        await user.save();

        res.status(200).json({ message: '비밀번호가 성공적으로 변경되었습니다.' });

    } catch (error) {
        console.error("비밀번호 변경 오류:", error);
        res.status(500).json({ message: '비밀번호 변경 중 서버 오류가 발생했습니다.', error: error.message });
    }
});


module.exports = router;

