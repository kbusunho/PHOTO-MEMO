import client from './client.js'; // Axios 인스턴스

/**
 * 로그인 API
 * @param {object} credentials - { email, password }
 * @returns {Promise<object>} { user, token } 객체
 */
export const login = async ({ email, password }) => {
  const response = await client.post('/api/auth/login', { email, password });
  return response.data;
};

/**
 * 회원가입 API
 * @param {object} userInfo - { email, password, nickname, phoneNumber }
 * @returns {Promise<object>} { user } 객체 (생성된 사용자 정보)
 */
export const signup = async ({ email, password, nickname, phoneNumber }) => {
  // phoneNumber를 요청 본문에 포함하여 백엔드로 전송
  const response = await client.post('/api/auth/register', { email, password, displayName: nickname, phoneNumber });
  return response.data;
};

/**
 * 내 정보 불러오기 API (토큰 기반)
 * @returns {Promise<object>} 사용자 정보 객체 (passwordHash 제외)
 */
export const getMe = async () => {
  // Authorization 헤더는 client.js의 인터셉터가 자동으로 처리
  const response = await client.get('/api/auth/me');
  return response.data;
};

// ======================================================
// 👇👇👇 비밀번호 변경 API 함수 추가됨 👇👇👇
// ======================================================
/**
 * 로그인한 사용자의 비밀번호 변경
 * @param {object} data - { currentPassword, newPassword }
 * @returns {Promise<object>} 성공 메시지 객체 { message: '...' }
 */
export const changePassword = async (data) => {
  const response = await client.put('/api/auth/change-password', data);
  return response.data;
};

