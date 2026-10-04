import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { blacklistToken } from '../config/redis.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';

// Fallback in-memory user store if MongoDB is offline
const fallbackUsers = [];

/**
 * Generates signed JWT authentication token
 */
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id || user.id, email: user.email, name: user.name },
    process.env.JWT_SECRET || 'cropshield_super_secret_jwt_key_2026_secure',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

/**
 * 1. Register a new farmer account
 */
export const register = asyncHandler(async (req, res) => {
  const { name, email, password, farmLocation, farmSize, primaryCrops, cropTypes } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
  }

  const formattedPrimaryCrops = primaryCrops || (Array.isArray(cropTypes) ? cropTypes.join(', ') : 'Rice, Wheat');
  const cropList = Array.isArray(cropTypes) ? cropTypes : formattedPrimaryCrops.split(',').map((s) => s.trim());

  let user = null;
  try {
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email is already registered.' });
    }

    user = await User.create({
      name,
      email,
      password,
      farmLocation: farmLocation || 'India',
      farmSize: Number(farmSize) || 5,
      primaryCrops: formattedPrimaryCrops,
      cropTypes: cropList,
    });
  } catch (dbErr) {
    if (dbErr.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: dbErr.message });
    }
    console.warn('[Auth] MongoDB offline, using in-memory store:', dbErr.message);

    if (fallbackUsers.some((u) => u.email === email)) {
      return res.status(400).json({ success: false, message: 'Email is already registered.' });
    }

    user = {
      id: `mock_${Date.now()}`,
      name,
      email,
      password,
      farmLocation: farmLocation || 'India',
      farmSize: Number(farmSize) || 5,
      primaryCrops: formattedPrimaryCrops,
      cropTypes: cropList,
      profileImage: '',
    };
    fallbackUsers.push(user);
  }

  const token = generateToken(user);
  return res.status(201).json({
    success: true,
    message: 'Account created successfully.',
    token,
    user: {
      id: user._id || user.id,
      name: user.name,
      email: user.email,
      farmLocation: user.farmLocation,
      farmSize: user.farmSize,
      primaryCrops: user.primaryCrops,
      cropTypes: user.cropTypes,
      profileImage: user.profileImage,
    },
  });
});

/**
 * 2. Login existing farmer
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required.' });
  }

  let user = null;
  try {
    user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }
  } catch (dbErr) {
    user = fallbackUsers.find((u) => u.email === email && u.password === password);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }
  }

  const token = generateToken(user);
  return res.json({
    success: true,
    message: 'Login successful.',
    token,
    user: {
      id: user._id || user.id,
      name: user.name,
      email: user.email,
      farmLocation: user.farmLocation,
      farmSize: user.farmSize,
      primaryCrops: user.primaryCrops,
      cropTypes: user.cropTypes,
      profileImage: user.profileImage,
    },
  });
});

/**
 * 3. Logout & blacklist JWT session token in Redis
 */
export const logout = asyncHandler(async (req, res) => {
  if (req.token) {
    await blacklistToken(req.token);
  }
  return res.json({ success: true, message: 'Logged out successfully.' });
});

/**
 * 4. Fetch authenticated user profile
 */
export const getMe = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  let user = null;

  try {
    user = await User.findById(userId);
  } catch (dbErr) {
    user = fallbackUsers.find((u) => u.id === userId);
  }

  if (!user) {
    return res.status(404).json({ success: false, message: 'User profile not found.' });
  }

  return res.json({ success: true, user });
});

/**
 * 5. Update user profile information
 */
export const updateProfile = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  const { profileImage, name, farmLocation, farmSize, primaryCrops } = req.body;

  const updateFields = {
    ...(profileImage !== undefined && { profileImage }),
    ...(name && { name }),
    ...(farmLocation && { farmLocation }),
    ...(farmSize && { farmSize: Number(farmSize) }),
    ...(primaryCrops && { primaryCrops }),
  };

  let updatedUser = null;
  try {
    updatedUser = await User.findByIdAndUpdate(userId, updateFields, { new: true });
  } catch (dbErr) {
    const user = fallbackUsers.find((u) => u.id === userId);
    if (user) {
      Object.assign(user, updateFields);
      updatedUser = user;
    }
  }

  if (!updatedUser) {
    return res.status(404).json({ success: false, message: 'User not found.' });
  }

  return res.json({
    success: true,
    message: 'Profile updated successfully.',
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
});
