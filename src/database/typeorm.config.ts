import { config as loadEnv } from 'dotenv';
import { join } from 'path';
import type { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';

import { Permission } from '../permission/permission.entity';
import { Plan } from '../plan/plan.entity';
import { Role } from '../role/role.entity';
import { Setting } from '../setting/setting.entity';
import { Tenant } from '../tenant/tenant.entity';
import { User } from '../user/user.entity';

loadEnv();

const parsePort = (value: string | undefined, fallback: number): number => {
  const parsedValue = Number(value);
  return Number.isNaN(parsedValue) ? fallback : parsedValue;
};

const isProd = process.env.NODE_ENV === 'production';

export const typeOrmConfig: PostgresConnectionOptions = {
  type: 'postgres',

  host: process.env.DB_HOST ?? 'localhost',
  port: parsePort(process.env.DB_PORT, 5432),
  username: process.env.DB_USERNAME ?? 'postgres',
  password: process.env.DB_PASSWORD ?? '123456',
  database: process.env.DB_DATABASE ?? 'app-saas',

  entities: [Tenant, User, Setting, Role, Permission, Plan],

  migrations: [join(__dirname, 'migrations', '*{.ts,.js}')],

  // 🔥 nunca auto-executar migrations no bootstrap
  migrationsRun: false,

  // opcional: só para debug
  logging: !isProd,

  // segurança padrão
  synchronize: false,
};
