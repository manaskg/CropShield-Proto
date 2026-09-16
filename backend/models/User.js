import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
    select: false,
  },
  farmLocation: {
    type: String,
    default: 'India',
  },
  farmSize: {
    type: Number,
    default: 5,
  },
  primaryCrops: {
    type: String,
    default: 'Rice, Wheat',
  },
  cropTypes: [{
    type: String,
  }],
  profileImage: {
    type: String,
    default: '',
  },
}, {
  timestamps: true,
});

// Password Hash Pre-Save Hook
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Instance method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model('User', userSchema);
