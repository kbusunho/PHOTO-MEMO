import client from './client.js';

/**
 * 관리자 대시보드 통계 불러오기
 */
export const getAdminStats = async () => {
  const response = await client.get('/api/admin/stats');
  return response.data; // { totalUsers, todayUsers, totalPhotos }
};