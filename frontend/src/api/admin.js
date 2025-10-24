import client from './client.js';

/**
 * 관리자 대시보드 통계 불러오기
 * @returns {Promise<object>} { totalUsers, todayUsers, totalPhotos, pendingReports }
 */
export const getAdminStats = async () => {
  const response = await client.get('/api/admin/stats');
  return response.data;
};

// ======================================================
// 👇👇👇 신고 관리 API 함수 추가됨 👇👇👇
// ======================================================

/**
 * 신고 목록 조회 (관리자 전용)
 * @param {object} params - { status: 'Pending'|'Resolved'|'Dismissed', page, limit }
 * @returns {Promise<object>} { reports: [], totalPages: N, ... }
 */
export const getReports = async (params = {}) => {
    const response = await client.get('/api/admin/reports', { params });
    return response.data;
};

/**
 * 신고 처리 (관리자 전용)
 * @param {string} reportId - 처리할 신고 ID
 * @param {string} newStatus - 'Resolved' 또는 'Dismissed'
 * @returns {Promise<object>} 업데이트된 신고 객체
 */
export const updateReportStatus = async (reportId, newStatus) => {
    if (!reportId || !newStatus) {
        throw new Error('신고 ID와 새 상태값은 필수입니다.');
    }
    const response = await client.put(`/api/admin/reports/${reportId}`, { newStatus });
    return response.data;
};

