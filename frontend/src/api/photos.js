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
 * isPublic (string 'true'/'false'), priceRange.
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
 * Fields: name, address, rating, memo, tags(JSON), visited(string), isPublic(string), priceRange, image (optional).
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

