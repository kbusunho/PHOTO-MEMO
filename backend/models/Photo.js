const express = require("express")
const router = express.Router()
const jwt = require("jsonwebtoken")
const bcrypt = require("bcrypt")
const User = require("../models/User")


function makeToken(user) {
    return jwt.sign(
        {
            id: user._id.toString(),
            role: user.role,
            email: user.email,
            displayName: user.displayName
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "7d"
        }

    )
}

router.post("/register", async (req, res) => {
    try {
        const { email, password, displayName } = req.body

        if (!email || !password) {
            return res.status(400).json({ message: "이메일/비밀번호 필요" })
        }

        const exists = await User.findOne({
            email: email.toLowerCase()
        })
        if (exists) {

            return res.status(400).json({ message: "이미 가입된 이메일" })
        }

        const passwordHash = await bcrypt.hash(password, 10)

        const user = await User.create({
            email,
            displayName,
            passwordHash,
        })

        res.status(201).json({ user: user.toSafeJSON() })

    } catch (error) {
        return res.status(500).json({
            message: "회원가입 실패",
            error: error.message
        })

    }
})

const LOCK_MAX = 5
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body
        const user = await User.findOne({
            email: email.toLowerCase(),
        })

        const invalidMsg = { message: "이메일 또는 비밀번호가 올바르지 않습니다." };
        if (!user) {
            return res.status(401).json(invalidMsg)
        }
        
        if (!user.isActive) {
          return res.status(423).json({ message: "계정이 비활성화되었습니다."})
        }

        const ok = await user.comparePassword(password)
        if (!ok) {
            user.loginAttempts += 1
            if (user.loginAttempts >= LOCK_MAX) {
                user.isActive = false
            }
            await user.save()
            return res.status(401).json(invalidMsg)
        }
        
        user.loginAttempts = 0
        user.isLoggined = true
        await user.save()

        const token = makeToken(user)

        return res.status(200).json({
            user: user.toSafeJSON(),
            token,
        })

    } catch (error) {
        return res.status(500).json({
            message: "로그인 실패",
            error: error.message
        })
    }
})

router.get("/me", auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
        }
        res.status(200).json(user.toSafeJSON());
    } catch (error) {
        res.status(500).json({ message: "내 정보 조회 실패", error: error.message });
    }
});

// auth 미들웨어를 사용하는 것으로 변경
const auth = require("../middlewares/auth")

router.get("/me", auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
        if (!user) return res.status(404).json({ message: "사용자 없음" })
        res.status(200).json(user.toSafeJSON())
    } catch (error) {
        res.status(500).json({ message: "내 정보 조회 실패", error: error.message })
    }
})

module.exports = router
