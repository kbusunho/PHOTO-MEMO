import client from './client.js'; // Axios instance configured with baseURL and interceptors

/**
 * Fetch logged-in user's restaurant records.
 * Supports filtering, sorting, and pagination.
 * @param {object} params - Optional query parameters.
 * @param {string} [params.search] - Search keyword for name, address, memo, tags.
 * @param {string} [params.sort] - Sort criteria ('rating_desc', 'rating_asc', 'name_asc', 'price_asc', 'price_desc'). Default is 'createdAt_desc'.
 * @param {string} [params.tag] - Filter by a specific tag.
 * @param {number} [params.page] - Page number for pagination (default: 1).
 * @param {number} [params.limit] - Number of items per page (default: 12).
 * @param {string} [params.visited] - Filter by visited status ('true' or 'false').
 * @param {string} [params.priceRange] - Filter by price range ('₩', '₩₩', etc.).
 * @returns {Promise<object>} An object containing { photos: [], totalPages: N, currentPage: N, totalCount: N }.
 */
export const getRestaurants = async (params = {}) => {
  // Pass the params object directly to Axios, which will handle query string generation
  const response = await client.get('/api/photos', { params });
  return response.data; // The backend returns the structured object
};

/**
 * Fetch the public feed of restaurants from all users.
 * Supports pagination and sorting.
 * @param {object} params - Optional query parameters.
 * @param {number} [params.page] - Page number for pagination (default: 1).
 * @param {number} [params.limit] - Number of items per page (default: 12).
 * @param {string} [params.sort] - Sort criteria (e.g., 'createdAt_desc').
 * @returns {Promise<object>} An object containing { photos: [], totalPages: N, currentPage: N, totalCount: N }. Photos include populated owner info.
 */
export const getFeedRestaurants = async (params = {}) => {
  const response = await client.get('/api/photos/feed', { params });
  return response.data;
};


/**
 * Fetch a specific user's publicly shared restaurant records.
 * @param {string} userId - The ID of the user whose public profile is being viewed.
 * @returns {Promise<object>} An object containing { photos: [], user: { displayName, email } }.
 */
export const getPublicRestaurants = async (userId) => {
  if (!userId) {
    throw new Error("User ID is required to fetch public restaurants.");
  }
  const response = await client.get(`/api/photos/public/${userId}`);
  return response.data;
};

/**
 * Upload a new restaurant record using FormData.
 * @param {FormData} formData - Must contain required fields: name, address, rating, image.
 * Optional fields: memo, tags (JSON stringified array), visited (string 'true'/'false'),
 * isPublic (string 'true'/'false'), priceRange, visitedDate.
 * @returns {Promise<object>} The newly created restaurant object from the backend.
 */
export const uploadRestaurant = async (formData) => {
  // Ensure Content-Type is set for FormData
  const response = await client.post('/api/photos', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

/**
 * Update an existing restaurant record using FormData.
 * @param {string} id - The ID of the restaurant record to update.
 * @param {FormData} formData - Contains the fields to update. Image is optional.
 * Fields: name, address, rating, memo, tags(JSON), visited(string), isPublic(string), priceRange, visitedDate, image (optional).
 * @returns {Promise<object>} The updated restaurant object from the backend.
 */
export const updateRestaurant = async (id, formData) => {
    if (!id) {
        throw new Error("Restaurant ID is required for update.");
    }
    const response = await client.put(`/api/photos/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
}

/**
 * Delete a restaurant record.
 * @param {string} id - The ID of the restaurant record to delete.
 * @returns {Promise<object>} Success message object, e.g., { message: '...' }.
 */
export const deleteRestaurant = async (id) => {
    if (!id) {
        throw new Error("Restaurant ID is required for deletion.");
    }
    const response = await client.delete(`/api/photos/${id}`);
    return response.data;
}

// ======================================================
// 👇👇👇 댓글 관련 API 함수 👇👇👇
// ======================================================

/**
 * 맛집 기록에 댓글 추가
 * @param {string} photoId - 댓글을 추가할 맛집 ID
 * @param {string} text - 댓글 내용
 * @returns {Promise<object>} 생성된 댓글 객체 (작성자 정보 포함)
 */
export const addComment = async (photoId, text) => {
    if (!photoId || !text) {
        throw new Error("맛집 ID와 댓글 내용은 필수입니다.");
    }
    const response = await client.post(`/api/photos/${photoId}/comments`, { text });
    return response.data;
};

/**
 * 맛집 기록에서 댓글 삭제
 * @param {string} photoId - 댓글이 속한 맛집 ID
 * @param {string} commentId - 삭제할 댓글 ID
 * @returns {Promise<object>} 성공 메시지 객체
 */
export const deleteComment = async (photoId, commentId) => {
    if (!photoId || !commentId) {
        throw new Error("맛집 ID와 댓글 ID는 필수입니다.");
    }
    const response = await client.delete(`/api/photos/${photoId}/comments/${commentId}`);
    return response.data;
};

/**
 * 맛집 기록의 댓글 수정
 * @param {string} photoId - 댓글이 속한 맛집 ID
 * @param {string} commentId - 수정할 댓글 ID
 * @param {string} text - 수정할 댓글 내용
 * @returns {Promise<object>} 수정된 댓글 객체 (작성자 정보 포함)
 */
export const editComment = async (photoId, commentId, text) => {
    if (!photoId || !commentId || text === undefined) {
        throw new Error("맛집 ID, 댓글 ID, 댓글 내용은 필수입니다.");
    }
    const response = await client.put(`/api/photos/${photoId}/comments/${commentId}`, { text });
    return response.data;
};

// ======================================================
// 👇👇👇 1. 좋아요 API 함수 추가됨 👇👇👇
// ======================================================
/**
 * 맛집 기록 '좋아요' 토글 (추가/취소)
 * @param {string} photoId - '좋아요' 할 맛집 ID
 * @returns {Promise<object>} { likeCount: N, isLikedByCurrentUser: boolean }
 */
export const toggleLike = async (photoId) => {
    if (!photoId) {
        throw new Error("맛집 ID는 필수입니다.");
    }
    // 백엔드에서 POST /:photoId/like가 토글 로직을 담당
    const response = await client.post(`/api/photos/${photoId}/like`);
    return response.data;
};

// ======================================================
// 👇👇👇 2. 신고 API 함수 추가됨 👇👇👇
// ======================================================
/**
 * 맛집 기록 또는 댓글 신고
 * @param {object} reportData - { targetType, targetId, targetPhotoId, reason }
 * @returns {Promise<object>} { message: '...' }
 */
export const reportContent = async (reportData) => {
    const { targetType, targetId, targetPhotoId, reason } = reportData;
    if (!targetType || !targetId || !targetPhotoId || !reason) {
        throw new Error('신고 정보가 올바르지 않습니다.');
    }
    const response = await client.post('/api/photos/report', reportData);
    return response.data;
};

