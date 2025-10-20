import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

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
        // 회원가입 시 닉네임(displayName)도 전달
        await signup({ email, password, nickname });
      }
      onClose();
    } catch (err) {
      // 백엔드에서 오는 에러 메시지를 사용
      setError(err.response?.data?.message || '이메일 또는 비밀번호가 올바르지 않습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg p-8 w-full max-w-md shadow-xl relative">
      <div className="flex border-b border-gray-200 mb-6">
        <button 
          className={`flex-1 py-3 text-center font-semibold ${isLogin ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500'}`}
          onClick={() => setIsLogin(true)}
        >
          로그인
        </button>
        <button 
          className={`flex-1 py-3 text-center font-semibold ${!isLogin ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500'}`}
          onClick={() => setIsLogin(false)}
        >
          회원가입
        </button>
        <button 
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl font-bold"
          onClick={onClose}
        >
          &times;
        </button>
      </div>
      <form className="space-y-4" onSubmit={handleSubmit}>
        {!isLogin && (
          <input 
            type="text" 
            placeholder="닉네임" 
            value={nickname} 
            onChange={(e) => setNickname(e.target.value)} 
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required 
          />
        )}
        <input 
          type="email" 
          placeholder="이메일" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          required 
        />
        <input 
          type="password" 
          placeholder="비밀번호" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          required 
        />
        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
        <button 
          type="submit" 
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg transition-colors disabled:opacity-50"
          disabled={loading}
        >
          {loading ? '처리 중...' : (isLogin ? '로그인' : '가입하기')}
        </button>
      </form>
    </div>
  );
};

export default AuthPanel;