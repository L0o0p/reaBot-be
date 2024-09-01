import { Body, Controller, Get, Post, Request } from '@nestjs/common';
import { CreateUser, UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private userService: UsersService) {}

  @Post('/create')
  //   handles the post request to /users/create endpoint to create new user
  async signUp(@Body() user: CreateUser) {
    return await this.userService.createUser(user);
  }
  @Get('/profile')
  //   handles the post request to /users/create endpoint to create new user
  async gerProfile(@Request() req) {
    console.log(req.username);
    return await this.userService.getUserByUsername(req.username);
  }
}