import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

const AuthPanel = ({ onClose }) => {
  const [isLogin, setIsLogin] = useState(true); // 현재 탭 상태 (로그인 vs 회원가입)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [phoneNumber, setPhoneNumber] = useState(''); // 전화번호 상태 추가
  const [error, setError] = useState(''); // 에러 메시지 상태
  const [loading, setLoading] = useState(false); // 로딩 상태 (API 호출 중)

  const { login, signup } = useAuth(); // AuthContext에서 함수 가져오기

  // 폼 제출 핸들러
  const handleSubmit = async (e) => {
    e.preventDefault(); // 기본 폼 제출 방지
    setError(''); // 이전 에러 메시지 초기화
    setLoading(true); // 로딩 시작

    try {
      if (isLogin) {
        // 로그인 API 호출
        await login({ email, password });
      } else {
        // 회원가입 API 호출 (phoneNumber 포함)
        await signup({ email, password, nickname, phoneNumber });
      }
      onClose(); // 성공 시 모달 닫기
    } catch (err) {
      // API 호출 실패 시 에러 메시지 설정
      setError(err.response?.data?.message || '요청 처리 중 오류가 발생했습니다.');
    } finally {
      setLoading(false); // 로딩 종료
    }
  };

  return (
    // 다크모드 스타일 적용
    <div className="bg-white dark:bg-gray-800 rounded-lg p-8 w-full max-w-md shadow-xl relative">
      {/* 탭 버튼 영역 */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
        <button
          className={`flex-1 py-3 text-center font-semibold transition-colors ${isLogin ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
          onClick={() => setIsLogin(true)}
        >
          로그인
        </button>
        <button
          className={`flex-1 py-3 text-center font-semibold transition-colors ${!isLogin ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
          onClick={() => setIsLogin(false)}
        >
          회원가입
        </button>
        {/* 닫기 버튼 */}
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-white text-2xl font-bold transition-colors"
          onClick={onClose}
        >
          &times;
        </button>
      </div>
      {/* 입력 폼 */}
      <form className="space-y-4" onSubmit={handleSubmit}>
        {/* 회원가입 탭일 때만 닉네임, 전화번호 필드 표시 */}
        {!isLogin && (
          <>
            <input
              type="text"
              placeholder="닉네임"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required // 닉네임은 필수로 설정
            />
            <input
              type="tel" // 'tel' 타입 사용
              placeholder="전화번호 (선택)"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              // required // 전화번호는 필수가 아님
            />
          </>
        )}
        {/* 이메일 필드 */}
        <input
          type="email"
          placeholder="이메일"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          required
        />
        {/* 비밀번호 필드 */}
        <input
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          required
        />
        {/* 에러 메시지 표시 */}
        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
        {/* 제출 버튼 */}
        <button
          type="submit"
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg transition-colors disabled:opacity-50"
          disabled={loading} // 로딩 중일 때 비활성화
        >
          {loading ? '처리 중...' : (isLogin ? '로그인' : '가입하기')}
        </button>
      </form>
    </div>
  );
};

export default AuthPanel;
