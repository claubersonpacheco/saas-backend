import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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

@Injectable()
export class SettingService {
  constructor(
    @InjectRepository(Setting)
    private readonly settingRepository: Repository<Setting>,
  ) {}

  findAll(tenantId: number): Promise<Setting[]> {
    return this.settingRepository.find({
      where: { tenantId },
      order: {
        id: 'ASC',
      },
    });
  }

  async findOne(id: number, tenantId: number): Promise<Setting> {
    const setting = await this.settingRepository.findOneBy({ id, tenantId });

    if (!setting) {
      throw new NotFoundException(`Setting with id ${id} not found.`);
    }

    return setting;
  }

  async create(createSettingDto: CreateSettingDto, tenantId: number): Promise<Setting> {
    const setting = this.settingRepository.create({
      ...createSettingDto,
      tenantId,
    });
    return this.settingRepository.save(setting);
  }

  async update(
    id: number,
    updateSettingDto: UpdateSettingDto,
    tenantId: number,
  ): Promise<Setting> {
    const setting = await this.findOne(id, tenantId);
    const updatedSetting = this.settingRepository.merge(
      setting,
      updateSettingDto,
    );
    return this.settingRepository.save(updatedSetting);
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

  private getBunnyStorageConfig(setting: Setting): {
    zoneName: string;
    accessKey: string;
    publicBaseUrl: string;
    logoFolder: string;
  } {
    const zoneName = setting.bunnyStorageZoneName?.trim();
    const accessKey = setting.bunnyStorageAccessKey?.trim();
    const publicBaseUrl = (
      setting.bunnyStorageCdnDomain ||
      setting.bunnyStorageBaseUrl ||
      ''
    )
      .trim()
      .replace(/\/+$/, '');

    if (!zoneName || !accessKey || !publicBaseUrl) {
      throw new BadRequestException(
        'Configure bunnyStorageZoneName, bunnyStorageAccessKey e bunnyStorageCdnDomain/baseUrl antes de enviar a logo.',
      );
    }

    return {
      zoneName,
      accessKey,
      publicBaseUrl: /^https?:\/\//.test(publicBaseUrl)
        ? publicBaseUrl
        : `https://${publicBaseUrl}`,
      logoFolder: setting.bunnyStorageLogoFolder?.trim() || 'logos',
    };
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
  ): Promise<Setting> {
    const setting = await this.findOne(id, tenantId);
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

    const config = this.getBunnyStorageConfig(setting);
    const baseName = this.sanitizePathSegment(setting.name || `setting-${setting.id}`);
    const fileName = `${setting.id}-${Date.now()}-${baseName || 'logo'}.${extension}`;
    const storagePath = `${config.logoFolder.replace(/\/+$/, '')}/${logoVariant}/${fileName}`;
    const uploadUrl = `https://storage.bunnycdn.com/${config.zoneName}/${storagePath}`;
    const uploadBody = new ArrayBuffer(file.buffer.byteLength);
    new Uint8Array(uploadBody).set(file.buffer);

    const response = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        AccessKey: config.accessKey,
        'Content-Type': file.mimetype,
      },
      body: uploadBody,
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new BadRequestException(
        `Nao foi possivel enviar a logo para Bunny Storage. ${body || response.statusText}`,
      );
    }

    const logoUrl = `${config.publicBaseUrl}/${storagePath}`;

    if (logoVariant === 'icon') {
      setting.logoIcon = logoUrl;
    } else if (logoVariant === 'print') {
      setting.logoPrint = logoUrl;
    } else {
      setting.logoWhite = logoUrl;
      setting.logo = logoUrl;
    }

    return this.settingRepository.save(setting);
  }

  async remove(id: number, tenantId: number): Promise<{ message: string }> {
    const setting = await this.findOne(id, tenantId);
    await this.settingRepository.remove(setting);

    return {
      message: 'Setting deleted successfully.',
    };
  }
}
