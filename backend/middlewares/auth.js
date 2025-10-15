const jwt = require("jsonwebtoken");

function auth(req, res, next) {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: "인증 헤더가 없거나 형식이 올바르지 않습니다." });
    }

    const token = authHeader.slice(7);

    if (!token) {
      return res.status(401).json({ message: "토큰이 제공되지 않았습니다." });
    }
    
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload; 

    next(); 
  } catch (error) {
    return res.status(401).json({
      message: "유효하지 않은 토큰입니다.",
      error: error.message,
    });
  }
}

module.exports = auth;
