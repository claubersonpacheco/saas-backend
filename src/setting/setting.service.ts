import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BunnyStorageService } from '../storage/bunny-storage.service';
import { Tenant } from '../tenant/tenant.entity';
import { CreateSettingDto } from './dto/create-setting.dto';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { Setting } from './setting.entity';

type UploadedImageFile = {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
};

type LogoVariant = 'icon' | 'print' | 'white';

export type BrandingResponse = {
  tenantId: number;
  name: string;
  logo: string | null;
  logoIcon: string | null;
  logoWhite: string | null;
};

export type SettingResponse = Setting;

@Injectable()
export class SettingService {
  constructor(
    @InjectRepository(Setting)
    private readonly settingRepository: Repository<Setting>,
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
    private readonly bunnyStorageService: BunnyStorageService,
  ) {}

  private sanitizeSetting(setting: Setting): SettingResponse {
    return setting;
  }

  async findAll(tenantId: number): Promise<SettingResponse[]> {
    const settings = await this.settingRepository.find({
      where: { tenantId },
      order: {
        id: 'ASC',
      },
    });

    return settings.map((setting) => this.sanitizeSetting(setting));
  }

  private async findEntity(id: number, tenantId: number): Promise<Setting> {
    const setting = await this.settingRepository.findOneBy({ id, tenantId });

    if (!setting) {
      throw new NotFoundException(`Setting with id ${id} not found.`);
    }

    return setting;
  }

  async findOne(id: number, tenantId: number): Promise<SettingResponse> {
    return this.sanitizeSetting(await this.findEntity(id, tenantId));
  }

  async findBrandingByTenantSlug(tenantSlug: string): Promise<BrandingResponse> {
    const slug = this.sanitizePathSegment(tenantSlug);
    const tenant = await this.tenantRepository.findOneBy({
      slug,
      active: true,
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant with slug ${slug} not found.`);
    }

    const [setting] = await this.settingRepository.find({
      where: { tenantId: tenant.id },
      order: { id: 'DESC' },
      take: 1,
    });

    return {
      tenantId: tenant.id,
      name: setting?.name || tenant.name,
      logo: setting?.logo || setting?.logoWhite || setting?.logoIcon || null,
      logoIcon: setting?.logoIcon || null,
      logoWhite: setting?.logoWhite || null,
    };
  }

  async create(createSettingDto: CreateSettingDto, tenantId: number): Promise<SettingResponse> {
    const setting = this.settingRepository.create({
      ...createSettingDto,
      tenantId,
    });
    return this.sanitizeSetting(await this.settingRepository.save(setting));
  }

  async update(
    id: number,
    updateSettingDto: UpdateSettingDto,
    tenantId: number,
  ): Promise<SettingResponse> {
    const setting = await this.findEntity(id, tenantId);
    const updatedSetting = this.settingRepository.merge(
      setting,
      updateSettingDto,
    );
    return this.sanitizeSetting(await this.settingRepository.save(updatedSetting));
  }

  private getImageExtension(file: UploadedImageFile): string {
    const extensionByMime: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/gif': 'gif',
      'image/svg+xml': 'svg',
    };

    return extensionByMime[file.mimetype] ?? '';
  }

  private sanitizePathSegment(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9-_]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase();
  }

  private normalizeLogoVariant(type?: string): LogoVariant {
    if (type === 'icon' || type === 'print' || type === 'white') {
      return type;
    }

    throw new BadRequestException(
      'Tipo de logo invalido. Use icon, print ou white.',
    );
  }

  async uploadLogo(
    id: number,
    tenantId: number,
    file?: UploadedImageFile,
    type: string = 'white',
  ): Promise<SettingResponse> {
    const setting = await this.findEntity(id, tenantId);
    const logoVariant = this.normalizeLogoVariant(type);

    if (!file) {
      throw new BadRequestException('Selecione uma logo para enviar.');
    }

    const extension = this.getImageExtension(file);

    if (!extension) {
      throw new BadRequestException('Envie uma logo JPG, PNG, WEBP, GIF ou SVG.');
    }

    if (file.size > 5 * 1024 * 1024) {
      throw new BadRequestException('A logo deve ter no maximo 5MB.');
    }

    const config = await this.bunnyStorageService.getConfig(tenantId);
    const tenant = await this.tenantRepository.findOneBy({ id: tenantId });

    if (!tenant) {
      throw new NotFoundException(`Tenant with id ${tenantId} not found.`);
    }

    const baseName = this.sanitizePathSegment(setting.name || `setting-${setting.id}`);
    const fileName = `${setting.id}-${Date.now()}-${baseName || 'logo'}.${extension}`;
    const storagePath = this.bunnyStorageService.buildStoragePath({
      tenantId,
      tenantFolder: tenant.code,
      tenantIsCentral: tenant.planId === null,
      folder: config.logoFolder,
      defaultFolder: 'logos',
      segments: [logoVariant],
      fileName,
    });
    const logoUrl = await this.bunnyStorageService.upload(
      storagePath,
      file,
      tenantId,
    );

    if (logoVariant === 'icon') {
      setting.logoIcon = logoUrl;
    } else if (logoVariant === 'print') {
      setting.logoPrint = logoUrl;
    } else {
      setting.logoWhite = logoUrl;
      setting.logo = logoUrl;
    }

    return this.sanitizeSetting(await this.settingRepository.save(setting));
  }

  async remove(id: number, tenantId: number): Promise<{ message: string }> {
    const setting = await this.findEntity(id, tenantId);
    await this.settingRepository.remove(setting);

    return {
      message: 'Setting deleted successfully.',
    };
  }
}
