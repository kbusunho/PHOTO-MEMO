const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth'); // Middleware for authentication
const admin = require('../middlewares/admin'); // Middleware for admin authorization
const User = require('../models/User'); // User model
const Photo = require('../models/Photo'); // Photo model (for deleting related data)
const mongoose = require('mongoose'); // For ObjectId validation (though not strictly needed here)

/**
 * @route   GET /api/users
 * @desc    Get all users (Admin only)
 * @access  Private (Admin)
 */
router.get('/', [auth, admin], async (req, res) => {
  try {
    // Find all users, exclude password hash, sort by creation date (newest first)
    const users = await User.find().select('-passwordHash').sort({ createdAt: -1 });
    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching user list:", error);
    res.status(500).json({ message: 'Failed to retrieve user list', error: error.message });
  }
});

/**
 * @route   DELETE /api/users/me
 * @desc    Delete logged-in user's own account (Withdrawal)
 * @access  Private (User - owner only)
 */
router.delete('/me', auth, async (req, res) => {
    try {
      const userIdToDelete = req.user.id; // Get user ID from auth middleware

      // Optional: Prevent deletion if the user is the last active admin
      const user = await User.findById(userIdToDelete);
      if (!user) {
          return res.status(404).json({ message: 'User not found.' });
      }
      if (user.role === 'admin') {
        // Count only *active* admins
        const activeAdminCount = await User.countDocuments({ role: 'admin', isActive: true });
        if (activeAdminCount <= 1) {
          return res.status(400).json({ message: 'The last active admin account cannot be deleted. Please assign another admin first or contact support.' });
        }
      }

      // 1. Delete all restaurant records (photos) owned by this user
      await Photo.deleteMany({ owner: userIdToDelete });

      // 2. Delete the user account itself
      await User.findByIdAndDelete(userIdToDelete);

      // 3. Send success message (client should handle logout and redirect)
      res.status(200).json({ message: 'Account and all related data successfully deleted.' });
    } catch (error) {
      console.error("Error deleting own account:", error);
      res.status(500).json({ message: 'Failed to delete account due to a server error.', error: error.message });
    }
  });


/**
 * @route   DELETE /api/users/:id
 * @desc    Delete a specific user (Admin only)
 * @access  Private (Admin)
 */
router.delete('/:id', [auth, admin], async (req, res) => {
  try {
    const userIdToDelete = req.params.id;
    const adminUserId = req.user.id; // ID of the admin performing the action

    // Prevent admin from deleting themselves using this specific route (use /me instead)
    if (userIdToDelete === adminUserId) {
      return res.status(400).json({ message: 'Admin accounts cannot delete themselves using this route. Please use the account withdrawal feature if intended.' });
    }

    // Find the user to delete
    const user = await User.findById(userIdToDelete);
    if (!user) {
      return res.status(404).json({ message: 'User to delete not found.' });
    }

    // Delete all restaurant records (photos) owned by this user
    await Photo.deleteMany({ owner: userIdToDelete });

    // Delete the user account
    await User.findByIdAndDelete(userIdToDelete);

    res.status(200).json({ message: 'User and their associated data successfully deleted.' });
  } catch (error) {
    console.error("Error deleting user (admin):", error);
    res.status(500).json({ message: 'Failed to delete user due to a server error.', error: error.message });
  }
});

/**
 * @route   PUT /api/users/:id
 * @desc    Update a specific user's info (Admin only - displayName, role, isActive)
 * @access  Private (Admin)
 */
router.put('/:id', [auth, admin], async (req, res) => {
  try {
    // Fields that can be updated by admin
    const { displayName, role, isActive } = req.body;
    const userIdToEdit = req.params.id;
    const adminUserId = req.user.id;

    // Find the user to edit
    const user = await User.findById(userIdToEdit);
    if (!user) {
      return res.status(404).json({ message: 'User to edit not found.' });
    }

    // Prevent changing role or deactivating the last *active* admin
    if (user.role === 'admin') { // Check only if the target user is currently an admin
        const activeAdminCount = await User.countDocuments({ role: 'admin', isActive: true });
        // Trying to change role FROM admin OR trying to deactivate
        if (role && role !== 'admin') {
             if (activeAdminCount <= 1 && user.isActive) { // Only prevent if they are the last ACTIVE admin
                 return res.status(400).json({ message: 'Cannot change the role of the last active admin.' });
             }
        }
        const requestedIsActive = (isActive === true || isActive === 'true');
        if (isActive !== undefined && !requestedIsActive) { // Trying to deactivate
             if (activeAdminCount <= 1 && user.isActive) { // Only prevent if they are the last ACTIVE admin
                 return res.status(400).json({ message: 'Cannot deactivate the last active admin.' });
             }
        }
    }


    // Update fields if provided in the request body
    if (displayName !== undefined) {
        user.displayName = displayName.trim(); // Trim whitespace
    }
    if (role && ['user', 'admin'].includes(role)) {
        // Prevent self-demotion if they are the only admin (redundant check, but safe)
        if (userIdToEdit === adminUserId && user.role === 'admin' && role === 'user') {
            const adminCount = await User.countDocuments({ role: 'admin', isActive: true });
            if (adminCount <= 1) {
                 return res.status(400).json({ message: 'Cannot demote the last active admin.' });
            }
        }
        user.role = role;
    }
    // Update isActive (convert string 'true'/'false' to boolean)
    if (isActive !== undefined) {
        user.isActive = (isActive === true || isActive === 'true');
    }

    // Save changes to the database
    await user.save();
    // Return updated user info (excluding password hash via toSafeJSON method)
    res.status(200).json(user.toSafeJSON());

  } catch (error) {
    // Handle Mongoose Validation errors (e.g., if schema constraints are violated)
    if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map(e => e.message);
        return res.status(400).json({ message: `Update failed: ${messages.join(', ')}` });
    }
    console.error("Error updating user info (admin):", error);
    res.status(500).json({ message: 'Failed to update user information due to a server error.', error: error.message });
  }
});


module.exports = router; // Export the router instance

