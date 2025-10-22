import client from './client.js'; // Axios instance configured with baseURL and interceptors

/**
 * Fetch all users (Admin only).
 * @returns {Promise<Array>} Array of user objects (excluding passwordHash).
 */
export const getAllUsers = async () => {
  const response = await client.get('/api/users');
  return response.data;
};

/**
 * Delete a specific user (Admin only).
 * @param {string} id - The ID of the user to delete.
 * @returns {Promise<object>} Success message object.
 */
export const deleteUser = async (id) => {
  if (!id) {
    throw new Error("User ID is required for deletion.");
  }
  const response = await client.delete(`/api/users/${id}`);
  return response.data;
};

/**
 * Update a specific user's information (Admin only).
 * @param {string} id - The ID of the user to update.
 * @param {object} data - Data to update: { displayName, role, isActive }.
 * @returns {Promise<object>} The updated user object (excluding passwordHash).
 */
export const updateUser = async (id, data) => {
  if (!id) {
    throw new Error("User ID is required for update.");
  }
  const response = await client.put(`/api/users/${id}`, data);
  return response.data;
};

/**
 * Delete the logged-in user's own account (Account Withdrawal).
 * @returns {Promise<object>} Success message object, e.g., { message: '...' }.
 */
export const deleteMe = async () => {
  const response = await client.delete('/api/users/me');
  return response.data;
};

