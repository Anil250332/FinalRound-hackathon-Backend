import bcrypt from 'bcryptjs';
import { userRepository } from '../repositories/user.repository.js';
import { hospitalRepository } from '../repositories/hospital.repository.js';

export class UserService {
  async getAllUsers(filter = {}) {
    return userRepository.findAll(filter);
  }

  async getUsersByHospital(hospitalId) {
    return userRepository.findByHospital(hospitalId);
  }

  async getUserById(id) {
    const user = await userRepository.findById(id);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  async createUser(data) {
    const existing = await userRepository.findByEmail(data.email);
    if (existing) {
      throw new Error('A user with this email already exists');
    }

    if (data.hospitalId) {
      const hospital = await hospitalRepository.findById(data.hospitalId);
      if (!hospital) {
        throw new Error('Associated hospital not found');
      }
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(data.password || 'Password@123', salt);

    const newUser = await userRepository.create({
      name: data.name,
      email: data.email.toLowerCase(),
      password: hashedPassword,
      role: data.role || 'BLOOD_BANK_OFFICER',
      hospitalId: data.hospitalId || null,
      phone: data.phone || '',
      isActive: data.isActive !== undefined ? data.isActive : true,
    });

    const userObj = newUser.toObject();
    delete userObj.password;
    return userObj;
  }

  async updateUser(id, updateData) {
    const user = await userRepository.findById(id);
    if (!user) {
      throw new Error('User not found');
    }

    const allowedUpdates = {};
    if (updateData.name !== undefined) allowedUpdates.name = updateData.name;
    if (updateData.phone !== undefined) allowedUpdates.phone = updateData.phone;
    if (updateData.role !== undefined) allowedUpdates.role = updateData.role;
    if (updateData.isActive !== undefined) allowedUpdates.isActive = updateData.isActive;
    if (updateData.hospitalId !== undefined) allowedUpdates.hospitalId = updateData.hospitalId;

    if (updateData.password) {
      const salt = await bcrypt.genSalt(10);
      allowedUpdates.password = await bcrypt.hash(updateData.password, salt);
    }

    return userRepository.update(id, allowedUpdates);
  }

  async toggleUserStatus(id, isActive) {
    const user = await userRepository.findById(id);
    if (!user) {
      throw new Error('User not found');
    }

    return userRepository.update(id, { isActive });
  }

  async deleteUser(id) {
    const user = await userRepository.findById(id);
    if (!user) {
      throw new Error('User not found');
    }

    return userRepository.delete(id);
  }
}

export const userService = new UserService();
