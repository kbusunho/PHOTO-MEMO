const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const cookieParser = require('cookie-parser');
dotenv.config();

// 라우트 임포트
const authRoutes = require("./routes/authRoutes");
const photoRoutes = require("./routes/photoRoutes");

const app = express();
const PORT = process.env.PORT || 3000;

// 미들웨어 설정
app.use(cors({
  origin: process.env.FRONT_ORIGIN,
  credentials: true
}));
app.use(express.json({ limit: "5mb" })); 
app.use(cookieParser());

// MongoDB 연결
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB 연결 성공"))
  .catch((err) => console.error("MongoDB 연결 실패:", err.message));

// API 라우트 등록
app.get("/", (_req, res) => res.send("Matzip-Log API OK"));
app.use("/api/auth", authRoutes);
app.use("/api/photos", photoRoutes);

// 일치하는 라우트가 없을 경우 404 에러 처리
app.use((req, res) => {
  res.status(404).json({ message: "요청하신 페이지를 찾을 수 없습니다." });
});

// 서버 실행
app.listen(PORT, () => {
  console.log(`Server running: http://localhost:${PORT}`);
});

