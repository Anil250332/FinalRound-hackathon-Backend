import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { userRepository } from '../repositories/user.repository.js';
import { hospitalRepository } from '../repositories/hospital.repository.js';
import { ENV } from '../config/env.js';

export class AuthService {
  generateToken(user) {
    return jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role,
        hospitalId: user.hospitalId ? user.hospitalId._id || user.hospitalId : null,
      },
      ENV.JWT_SECRET,
      { expiresIn: ENV.JWT_EXPIRES_IN }
    );
  }

  async login(email, password) {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    if (!user.isActive) {
      throw new Error('Account has been suspended or deactivated');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new Error('Invalid email or password');
    }

    const token = this.generateToken(user);
    const userObject = user.toObject();
    delete userObject.password;

    return { token, user: userObject };
  }

  async getMe(userId) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  async createStaff(creatorUser, staffData) {
    if (!creatorUser.hospitalId) {
      throw new Error('Only hospital administrators can create staff');
    }

    const existingUser = await userRepository.findByEmail(staffData.email);
    if (existingUser) {
      throw new Error('A user with this email already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(staffData.password, salt);

    const newUser = await userRepository.create({
      ...staffData,
      password: hashedPassword,
      hospitalId: creatorUser.hospitalId,
    });

    const userObj = newUser.toObject();
    delete userObj.password;
    return userObj;
  }

  async getDemoUsers() {
    const users = await userRepository.findAll({ isActive: true });
    return users.map((u) => ({
      _id: u._id,
      name: u.name,
      email: u.email,
      role: u.role,
      hospital: u.hospitalId ? { _id: u.hospitalId._id, name: u.hospitalId.name, code: u.hospitalId.hospitalCode } : null,
    }));
  }
}

export const authService = new AuthService();
