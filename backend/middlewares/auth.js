const jwt = require("jsonwebtoken");

function auth(req, res, next) {
  try {
    // 'Authorization' 헤더를 가져옵니다.
    const authHeader = req.header('Authorization');
    
    // 헤더가 없거나 'Bearer '로 시작하지 않으면 에러 처리
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: "인증 헤더가 없거나 형식이 올바르지 않습니다." });
    }

    // "Bearer " 부분을 제거하여 실제 토큰만 추출합니다.
    const token = authHeader.slice(7);

    if (!token) {
      return res.status(401).json({ message: "토큰이 제공되지 않았습니다." });
    }
    
    // 토큰을 검증하고, 검증된 payload를 req.user에 저장합니다.
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload; 

    // 다음 미들웨어 또는 라우트 핸들러로 제어를 넘깁니다.
    next(); 
  } catch (error) {
    // 토큰이 만료되었거나, 변조된 경우 등 검증 실패 시
    return res.status(401).json({
      message: "유효하지 않은 토큰입니다.",
      error: error.message,
    });
  }
}

module.exports = auth;