import { User } from '../models/User.js';

export class UserRepository {
  async findByEmail(email) {
    return User.findOne({ email }).populate('hospitalId');
  }

  async findById(id) {
    return User.findById(id).populate('hospitalId').select('-password');
  }

  async findByIdWithPassword(id) {
    return User.findById(id).populate('hospitalId');
  }

  async findAll(filter = {}) {
    return User.find(filter).populate('hospitalId').select('-password').sort({ createdAt: -1 });
  }

  async findByHospital(hospitalId) {
    return User.find({ hospitalId }).select('-password').sort({ createdAt: -1 });
  }

  async create(data) {
    return User.create(data);
  }

  async update(id, updateData) {
    return User.findByIdAndUpdate(id, updateData, { new: true, runValidators: true }).select('-password');
  }

  async delete(id) {
    return User.findByIdAndDelete(id);
  }

  async count(filter = {}) {
    return User.countDocuments(filter);
  }
}

export const userRepository = new UserRepository();
