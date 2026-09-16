import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { blacklistToken } from '../config/redis.js';

// Fallback in-memory user store if MongoDB is offline
const fallbackUsers = [];

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id || user.id, email: user.email, name: user.name },
    process.env.JWT_SECRET || 'cropshield_super_secret_jwt_key_2026_secure',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

export const register = async (req, res) => {
  try {
    const { name, email, password, farmLocation, farmSize, primaryCrops, cropTypes } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }

    try {
      // Try MongoDB
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ success: false, message: 'Email is already registered.' });
      }

      const formattedPrimaryCrops = primaryCrops || (Array.isArray(cropTypes) ? cropTypes.join(', ') : 'Rice, Wheat');
      const user = await User.create({
        name,
        email,
        password,
        farmLocation: farmLocation || 'India',
        farmSize: Number(farmSize) || 5,
        primaryCrops: formattedPrimaryCrops,
        cropTypes: Array.isArray(cropTypes) ? cropTypes : formattedPrimaryCrops.split(',').map(s => s.trim()),
      });

      const token = generateToken(user);

      return res.status(201).json({
        success: true,
        message: 'Account created successfully.',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          farmLocation: user.farmLocation,
          farmSize: user.farmSize,
          primaryCrops: user.primaryCrops,
          cropTypes: user.cropTypes,
          profileImage: user.profileImage,
        },
      });
    } catch (dbError) {
      if (dbError.name === 'ValidationError') {
        return res.status(400).json({ success: false, message: dbError.message });
      }
      // Memory fallback only if database connection is offline
      console.warn('[Auth] Database error, falling back to memory store:', dbError.message);
      const existing = fallbackUsers.find(u => u.email === email);
      if (existing) {
        return res.status(400).json({ success: false, message: 'Email is already registered.' });
      }

      const user = {
        id: `mock_${Date.now()}`,
        name,
        email,
        password,
        farmLocation: farmLocation || 'India',
        farmSize: Number(farmSize) || 5,
        primaryCrops: primaryCrops || 'Rice, Wheat',
        cropTypes: cropTypes || [],
        profileImage: '',
      };
      fallbackUsers.push(user);
      const token = generateToken(user);

      return res.status(201).json({
        success: true,
        message: 'Account created successfully (Memory Store).',
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          farmLocation: user.farmLocation,
          farmSize: user.farmSize,
          primaryCrops: user.primaryCrops,
          cropTypes: user.cropTypes,
          profileImage: user.profileImage,
        },
      });
    }
  } catch (error) {
    console.error('Register Error:', error);
    res.status(500).json({ success: false, message: 'Server error during registration.', error: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    try {
      const user = await User.findOne({ email }).select('+password');
      if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid email or password.' });
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid email or password.' });
      }

      const token = generateToken(user);

      return res.json({
        success: true,
        message: 'Login successful.',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          farmLocation: user.farmLocation,
          farmSize: user.farmSize,
          primaryCrops: user.primaryCrops,
          cropTypes: user.cropTypes,
          profileImage: user.profileImage,
        },
      });
    } catch (dbError) {
      // Memory fallback
      const user = fallbackUsers.find(u => u.email === email && u.password === password);
      if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid email or password.' });
      }
      const token = generateToken(user);
      return res.json({
        success: true,
        message: 'Login successful (Memory Store).',
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          farmLocation: user.farmLocation,
          farmSize: user.farmSize,
          primaryCrops: user.primaryCrops,
          cropTypes: user.cropTypes,
          profileImage: user.profileImage,
        },
      });
    }
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ success: false, message: 'Server error during login.', error: error.message });
  }
};

export const logout = async (req, res) => {
  try {
    const token = req.token;
    if (token) {
      await blacklistToken(token);
    }
    res.json({ success: true, message: 'Logged out successfully. Session invalidated in Redis.' });
  } catch (error) {
    console.error('Logout Error:', error);
    res.status(500).json({ success: false, message: 'Server error during logout.' });
  }
};

export const getMe = async (req, res) => {
  try {
    const userId = req.user?.id;
    try {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found.' });
      }
      return res.json({ success: true, user });
    } catch (e) {
      const user = fallbackUsers.find(u => u.id === userId);
      if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
      return res.json({ success: true, user });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching profile.', error: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { profileImage, name, farmLocation, farmSize, primaryCrops } = req.body;

    let updatedUser = null;
    try {
      updatedUser = await User.findByIdAndUpdate(
        userId,
        {
          ...(profileImage !== undefined && { profileImage }),
          ...(name && { name }),
          ...(farmLocation && { farmLocation }),
          ...(farmSize && { farmSize: Number(farmSize) }),
          ...(primaryCrops && { primaryCrops }),
        },
        { new: true }
      );
    } catch (dbErr) {
      const user = fallbackUsers.find(u => u.id === userId);
      if (user) {
        if (profileImage !== undefined) user.profileImage = profileImage;
        if (name) user.name = name;
        if (farmLocation) user.farmLocation = farmLocation;
        if (farmSize) user.farmSize = Number(farmSize);
        if (primaryCrops) user.primaryCrops = primaryCrops;
        updatedUser = user;
      }
    }

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    return res.json({
      success: true,
      message: 'Profile updated successfully in database.',
      user: {
        id: updatedUser._id || updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        farmLocation: updatedUser.farmLocation,
        farmSize: updatedUser.farmSize,
        primaryCrops: updatedUser.primaryCrops,
        cropTypes: updatedUser.cropTypes,
        profileImage: updatedUser.profileImage,
      },
    });
  } catch (error) {
    console.error('[Auth Controller] Update Profile Error:', error);
    res.status(500).json({ success: false, message: 'Failed to update profile.', error: error.message });
  }
};

