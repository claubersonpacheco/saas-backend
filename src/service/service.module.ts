import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../user/user.entity';
import { ServiceController } from './service.controller';
import { Service } from './service.entity';
import { ServiceService } from './service.service';

@Module({
  imports: [TypeOrmModule.forFeature([Service, User])],
  controllers: [ServiceController],
  providers: [ServiceService],
  exports: [ServiceService],
})
export class ServiceModule {}
