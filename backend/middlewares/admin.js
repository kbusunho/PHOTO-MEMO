function admin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: '접근 권한이 없습니다. 관리자 전용 기능입니다.' });
  }
  next();
}

module.exports = admin;