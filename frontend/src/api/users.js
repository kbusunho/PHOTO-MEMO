import client from './client.js';

/**
 * 모든 사용자 목록 불러오기 (관리자 전용)
 * @returns {Promise<Array>} 사용자 객체 배열
 */
export const getAllUsers = async () => {
  const response = await client.get('/api/users');
  return response.data;
};

/**
 * 특정 사용자 삭제 (관리자 전용)
 * @param {string} id - 삭제할 사용자의 ID
 * @returns {Promise<object>} 성공 메시지 객체
 */
export const deleteUser = async (id) => {
  const response = await client.delete(`/api/users/${id}`);
  return response.data;
};

/**
 * 특정 사용자 정보 수정 (관리자 전용)
 * @param {string} id - 수정할 사용자의 ID
 * @param {object} data - 수정할 데이터 { displayName, role }
 * @returns {Promise<object>} 업데이트된 사용자 객체 (passwordHash 제외)
 */
export const updateUser = async (id, data) => {
  const response = await client.put(`/api/users/${id}`, data);
  return response.data; // 업데이트된 user 객체 반환
};

// ======================================================
// 👇👇👇 회원 탈퇴 API 함수 추가됨 👇👇👇
// ======================================================
/**
 * 로그인한 사용자 본인 계정 삭제 (회원 탈퇴)
 * @returns {Promise<object>} 성공 메시지 객체
 */
export const deleteMe = async () => {
  const response = await client.delete('/api/users/me');
  return response.data; // { message: '...' }
};