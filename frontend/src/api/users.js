import client from './client.js';

/**
 * 모든 사용자 목록 불러오기 (관리자 전용)
 */
export const getAllUsers = async () => {
  const response = await client.get('/api/users');
  return response.data;
};

/**
 * 특정 사용자 삭제 (관리자 전용)
 * @param {string} id - 삭제할 사용자의 ID
 */
export const deleteUser = async (id) => {
  const response = await client.delete(`/api/users/${id}`);
  return response.data;
};

// ======================================================
// 👇👇👇 이 함수가 새로 추가되었습니다! 👇👇👇
// ======================================================
/**
 * 특정 사용자 정보 수정 (관리자 전용)
 * @param {string} id - 수정할 사용자의 ID
 * @param {object} data - { displayName, role }
 */
export const updateUser = async (id, data) => {
  const response = await client.put(`/api/users/${id}`, data);
  return response.data; // 업데이트된 user 객체 반환
};