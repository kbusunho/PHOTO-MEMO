import client from './client.js';

// 로그인 API
export const login = async ({ email, password }) => {
  // 실제 백엔드 API 호출 (엔드포인트는 예시입니다)
  // const response = await client.post('/auth/login', { email, password });
  // return response.data;

  // --- 임시 테스트 로직 ---
  console.log("API: Logging in with", email);
  await new Promise(resolve => setTimeout(resolve, 500)); // 0.5초 딜레이
  return {
    token: 'fake-jwt-token-12345',
    user: { email, nickname: '테스트유저' }
  };
};

// 회원가입 API
export const signup = async ({ email, password, nickname }) => {
  // 실제 백엔드 API 호출
  // const response = await client.post('/auth/signup', { email, password, nickname });
  // return response.data;
  
  // --- 임시 테스트 로직 ---
  console.log("API: Signing up with", email, nickname);
  await new Promise(resolve => setTimeout(resolve, 500));
  return { message: 'Signup successful' };
};

// 내 정보 불러오기 API
export const getMe = async () => {
  // 실제 백엔드 API 호출
  // const response = await client.get('/users/me');
  // return response.data;

  // --- 임시 테스트 로직 ---
  console.log("API: Fetching user info");
  await new Promise(resolve => setTimeout(resolve, 500));
  return { email: 'user@example.com', nickname: '테스트유저' };
};