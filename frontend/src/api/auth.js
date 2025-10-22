import client from './client.js';

// 로그인 API
export const login = async ({ email, password }) => {
  const response = await client.post('/api/auth/login', { email, password });
  return response.data; // { user, token }
};

// 회원가입 API (수정됨)
export const signup = async ({ email, password, nickname, phoneNumber }) => {
  // phoneNumber를 요청 본문에 포함하여 백엔드로 전송
  const response = await client.post('/api/auth/register', { email, password, displayName: nickname, phoneNumber });
  return response.data;
};

// 내 정보 불러오기 API
export const getMe = async () => {
  // Authorization 헤더는 client.js의 인터셉터가 자동으로 처리
  const response = await client.get('/api/auth/me');
  return response.data; // 사용자 정보 객체 (passwordHash 제외)
};
