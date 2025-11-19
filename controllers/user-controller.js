// controllers/user.js
import { UserModel } from '../models/user.js';
import { StatusCodes } from 'http-status-codes';

// Get current user's profile
export const getUserProfile = async (req, res, next) => {
  try {
    const user = await UserModel.findById(req.user.id).select('-password');
    res.status(StatusCodes.OK).json({
      status: 'success',
      data: {
        user
      }
    });
  } catch (error) {
    next(error);
  }
};

// Update current user's profile
export const updateUserProfile = async (req, res, next) => {
  try {
    // Filter out unwanted fields
    const { password, ...filteredBody } = req.body;

    const updatedUser = await UserModel.findByIdAndUpdate(
      req.user.id,
      filteredBody,
      {
        new: true,
        runValidators: true
      }
    ).select('-password');

    res.status(StatusCodes.OK).json({
      status: 'success',
      data: {
        user: updatedUser
      }
    });
  } catch (error) {
    next(error);
  }
};

// Delete current user's account (soft delete)
export const deleteUserAccount = async (req, res, next) => {
  try {
    await UserModel.findByIdAndUpdate(
      req.user.id,
      { isActive: false }
    );

    res.status(StatusCodes.NO_CONTENT).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    next(error);
  }
};