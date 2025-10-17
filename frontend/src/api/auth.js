import client from './client.js';

// 로그인 API
export const login = async ({ email, password }) => {
  const response = await client.post('/api/auth/login', { email, password });
  return response.data; // { user, token }
};

// 회원가입 API
export const signup = async ({ email, password, displayName }) => {
  const response = await client.post('/api/auth/register', { email, password, displayName });
  return response.data;
};

// 내 정보 불러오기 API
export const getMe = async () => {
  const response = await client.get('/api/auth/me');
  return response.data;
};