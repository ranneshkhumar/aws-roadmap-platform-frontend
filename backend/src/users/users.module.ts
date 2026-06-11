import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { LearnersController } from './learners.controller';

@Module({
  controllers: [LearnersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
