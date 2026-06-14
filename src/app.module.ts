import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { BudgetModule } from './budget/budget.module';
import { typeOrmConfig } from './database/typeorm.config';
import { GlobalSettingModule } from './global-setting/global-setting.module';
import { PermissionModule } from './permission/permission.module';
import { PlanModule } from './plan/plan.module';
import { RoleModule } from './role/role.module';
import { UserModule } from './user/user.module';
import { SettingModule } from './setting/setting.module';
import { ServiceModule } from './service/service.module';
import { TenantModule } from './tenant/tenant.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', 'backend/.env', '../.env'],
    }),
    TypeOrmModule.forRoot({
      ...typeOrmConfig,
      autoLoadEntities: true,
    }),
    AuthModule,
    GlobalSettingModule,
    UserModule,
    SettingModule,
    TenantModule,
    PermissionModule,
    RoleModule,
    PlanModule,
    ServiceModule,
    BudgetModule,
  ],
})
export class AppModule {}
