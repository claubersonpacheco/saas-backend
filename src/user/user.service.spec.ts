import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permission } from '../permission/permission.entity';
import { Role } from '../role/role.entity';
import { BunnyStorageService } from '../storage/bunny-storage.service';
import { Tenant } from '../tenant/tenant.entity';
import { TenantService } from '../tenant/tenant.service';
import { User } from './user.entity';
import { UserService } from './user.service';

describe('UserService', () => {
  let service: UserService;
  let tenantService: {
    create: jest.Mock;
    findBySlug: jest.Mock;
    findOne: jest.Mock;
  };

  beforeEach(async () => {
    tenantService = {
      create: jest.fn(),
      findBySlug: jest.fn(),
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            find: jest.fn(),
            findOneBy: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            merge: jest.fn(),
            remove: jest.fn(),
          } satisfies Partial<Record<keyof Repository<User>, jest.Mock>>,
        },
        {
          provide: getRepositoryToken(Role),
          useValue: {},
        },
        {
          provide: getRepositoryToken(Permission),
          useValue: {},
        },
        {
          provide: getRepositoryToken(Tenant),
          useValue: {},
        },
        {
          provide: TenantService,
          useValue: tenantService,
        },
        {
          provide: BunnyStorageService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('creates a tenant when registering with a new tenantName and tenantSlug', async () => {
    const createdTenant = { id: 1, name: 'Minha Empresa', slug: 'minha-empresa' };
    tenantService.findBySlug.mockResolvedValue(null);
    tenantService.create.mockResolvedValue(createdTenant);

    await expect(
      service['resolveTenant']({
        username: 'admin',
        name: 'Admin',
        email: 'admin@example.com',
        password: 'password123',
        tenantName: 'Minha Empresa',
        tenantSlug: 'minha-empresa',
      }),
    ).resolves.toBe(createdTenant);

    expect(tenantService.findBySlug).toHaveBeenCalledWith('minha-empresa');
    expect(tenantService.create).toHaveBeenCalledWith({
      name: 'Minha Empresa',
      slug: 'minha-empresa',
    });
  });
});
