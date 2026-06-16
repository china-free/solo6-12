import { UserRepository } from '../repositories/Repositories.js';
import type { User } from '../../shared/types.js';

export const UserService = {
  listAll(): User[] {
    return UserRepository.findAll();
  },
};
