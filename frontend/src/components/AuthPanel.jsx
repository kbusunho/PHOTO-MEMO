import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import './styles/AuthPanel.scss';

const AuthPanel = ({ onClose }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, signup } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await login({ email, password });
      } else {
        await signup({ email, password, nickname });
      }
      onClose();
    } catch (err) {
      setError(err.message || '이메일 또는 비밀번호가 올바르지 않습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-panel">
      <div className="auth-tabs">
        <button className={`tab ${isLogin ? 'active' : ''}`} onClick={() => setIsLogin(true)}>로그인</button>
        <button className={`tab ${!isLogin ? 'active' : ''}`} onClick={() => setIsLogin(false)}>회원가입</button>
        <button className="close-btn" onClick={onClose}>&times;</button>
      </div>
      <form className="auth-form" onSubmit={handleSubmit}>
        {!isLogin && (
          <input type="text" placeholder="닉네임" value={nickname} onChange={(e) => setNickname(e.target.value)} required />
        )}
        <input type="email" placeholder="이메일" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input type="password" placeholder="비밀번호" value={password} onChange={(e) => setPassword(e.target.value)} required />
        {error && <p className="error-message">{error}</p>}
        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? '처리 중...' : (isLogin ? '로그인' : '가입하기')}
        </button>
      </form>
    </div>
  );
};

export default AuthPanel;