import client from './client.js';

/**
 * 모든 사용자 목록 불러오기 (관리자 전용)
 */
export const getAllUsers = async () => {
  const response = await client.get('/api/users');
  return response.data;
};