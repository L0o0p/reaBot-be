import { Body, Controller, Get, Post, Req, Request, UseGuards } from '@nestjs/common';
import { CreateUser, UsersService } from './users.service';
import { JwtAuthGuard } from 'src/auth/jwt.guard';

@Controller('users')
export class UsersController {
  constructor(private userService: UsersService) {}

  @Post('/create')
  //   handles the post request to /users/create endpoint to create new user
  async signUp(@Body() user: CreateUser) {
    return await this.userService.register(user);
  }
  
  @UseGuards(JwtAuthGuard)
  @Get('/profile')
  //   handles the post request to /users/create endpoint to create new user
  async gerProfile( @Req() req: any & {user: { id: number, username: string}}) {
    console.log(req.user.user);
    return await this.userService.findByUsername(req.user.user.username);
  }
}

