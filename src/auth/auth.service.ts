import {
  Injectable,
  Logger,
  NotFoundException,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
} from '@nestjs/common';
import { User } from 'src/users/users.entity';
// import { CreateUser } from 'src/users/users.service';
import { DataSource } from 'typeorm';

@Injectable()
export class AuthService {
  private userRepository;
  private logger = new Logger();
  constructor(private dataSource: DataSource) {
    this.userRepository = this.dataSource.getRepository(User);
  }
  // async createUser(createUser: CreateUser): Promise<User> {
  //   // Existing create user implementation
  // }
  async getAllUsers(): Promise<User[]> {
    try {
      const users = await this.userRepository.find();
      return users;
    } catch (err) {
      this.logger.error(err.message, err.stack);
      throw new InternalServerErrorException('Failed to retrieve users');
    }
  }
  async getUserById(id: number): Promise<User> {
    try {
      const user = await this.userRepository.findOneBy({ id });
      if (!user) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }
      return user;
    } catch (err) {
      this.logger.error(
        `Failed to find user by ID ${id}: ${err.message}`,
        err.stack,
      );
      if (err instanceof NotFoundException) {
        throw err;
      }
      throw new InternalServerErrorException(
        'Something went wrong, Try again!',
      );
    }
  }

  async deleteUser(userDetails: User): Promise<void> {
    try {
      const user = await this.userRepository.findOneBy({
        username: userDetails.username,
      });
      if (!user) {
        throw new NotFoundException(
          `User with username '${userDetails.username}' not found`,
        );
      }
      await this.userRepository.remove(user);
    } catch (err) {
      this.logger.error(`Failed to delete user: ${err.message}`, err.stack);
      if (err instanceof NotFoundException) {
        throw err;
      }
      throw new InternalServerErrorException(
        'Failed to delete user, try again!',
      );
    }
  }
}

