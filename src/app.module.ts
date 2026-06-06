import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { typeOrmConfig } from './database/typeorm.config';
import { PermissionModule } from './permission/permission.module';
import { PlanModule } from './plan/plan.module';
import { RoleModule } from './role/role.module';
import { UserModule } from './user/user.module';
import { SettingModule } from './setting/setting.module';
import { TenantModule } from './tenant/tenant.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      ...typeOrmConfig,
      autoLoadEntities: true,
    }),
    AuthModule,
    UserModule,
    SettingModule,
    TenantModule,
    PermissionModule,
    RoleModule,
    PlanModule,
  ],
})
export class AppModule {}
