import client from './client.js';

// 로그인 API
export const login = async ({ email, password }) => {
  const response = await client.post('/api/auth/login', { email, password });
  return response.data; // { user, token }
};

// 회원가입 API
// 백엔드의 /register 엔드포인트에 맞게 displayName을 보냅니다.
export const signup = async ({ email, password, nickname }) => {
  const response = await client.post('/api/auth/register', { email, password, displayName: nickname });
  return response.data;
};

// 내 정보 불러오기 API
export const getMe = async () => {
  const response = await client.get('/api/auth/me');
  return response.data;
};