import {
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { User } from './users.entity';

export interface CreateUser {
  email: string;
  username: string;
}

@Injectable()
export class UsersService {
  private userRepository;
  private logger = new Logger();
  //   inject the Datasource provider
  constructor(private dataSource: DataSource) {
    // get users table repository to interact with the database
    this.userRepository = this.dataSource.getRepository(User);
  }
  //  create handler to create new user and save to the database
  async createUser(createUser: CreateUser): Promise<User> {
    try {
      const user = await this.userRepository.create(createUser);
      return await this.userRepository.save(user);
    } catch (err) {
      if (err.code == 23505) {
        this.logger.error(err.message, err.stack);
        throw new HttpException('Username already exists', HttpStatus.CONFLICT);
      }
      this.logger.error(err.message, err.stack);
      throw new InternalServerErrorException(
        'Something went wrong, Try again!',
      );
    }
  }
  // Method to retrieve a user by username
  async getUserByUsername(username: string): Promise<User> {
    const user = await this.userRepository.findOneBy({ username });
    if (!user) {
      this.logger.error(`User not found: ${username}`);
      throw new NotFoundException(`User with username '${username}' not found`);
    }
    return user;
  }
}
