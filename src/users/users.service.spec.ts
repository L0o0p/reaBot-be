import {
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { User } from './users.entity';

export interface CreateUser {
  username: string;
  password: string;
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
}