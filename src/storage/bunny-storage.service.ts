import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GlobalSetting } from '../global-setting/global-setting.entity';

type UploadedStorageFile = {
  buffer: Buffer;
  mimetype: string;
};

type BunnyStorageConfig = {
  zoneName: string;
  accessKey: string;
  publicBaseUrl: string;
  userFolder: string;
  logoFolder: string;
};

type StoragePathOptions = {
  tenantId?: number | null;
  tenantFolder?: string | null;
  tenantIsCentral?: boolean;
  folder: string;
  defaultFolder?: string;
  segments?: string[];
  fileName: string;
};

@Injectable()
export class BunnyStorageService {
  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(GlobalSetting)
    private readonly globalSettingRepository: Repository<GlobalSetting>,
  ) {}

  private normalizePublicUrl(value?: string | null): string {
    const publicBaseUrl = (value || '').trim().replace(/\/+$/, '');

    if (!publicBaseUrl) {
      return '';
    }

    return /^https?:\/\//.test(publicBaseUrl)
      ? publicBaseUrl
      : `https://${publicBaseUrl}`;
  }

  private normalizePathSegment(value: string): string {
    return value.replace(/^\/+|\/+$/g, '');
  }

  private getStoragePathFromPublicUrl(
    publicUrl: string,
    publicBaseUrl: string,
  ): string {
    const cleanPublicUrl = publicUrl.trim();

    if (!cleanPublicUrl) {
      return '';
    }

    const cleanPublicBaseUrl = publicBaseUrl.replace(/\/+$/, '');

    if (cleanPublicUrl.startsWith(`${cleanPublicBaseUrl}/`)) {
      return cleanPublicUrl.slice(cleanPublicBaseUrl.length + 1);
    }

    try {
      return decodeURIComponent(
        new URL(cleanPublicUrl).pathname.replace(/^\/+/, ''),
      );
    } catch {
      return cleanPublicUrl.replace(/^\/+/, '');
    }
  }

  buildStoragePath({
    tenantId,
    tenantFolder,
    tenantIsCentral = false,
    folder,
    defaultFolder,
    segments = [],
    fileName,
  }: StoragePathOptions): string {
    const folderSegments = this.normalizePathSegment(folder)
      .split('/')
      .filter(Boolean);
    const normalizedTenantFolder = tenantFolder
      ? this.normalizePathSegment(tenantFolder).toLowerCase()
      : '';
    const scopeFolder = tenantIsCentral || !tenantId
      ? 'central'
      : `tenant/${normalizedTenantFolder || String(tenantId)}`;

    if (
      folderSegments[0]?.toLowerCase() === 'central' ||
      folderSegments[0]?.toLowerCase() === normalizedTenantFolder
    ) {
      folderSegments.shift();
    }

    if (folderSegments[0]?.toLowerCase() === 'tenant') {
      folderSegments.shift();

      if (folderSegments[0]?.toLowerCase() === normalizedTenantFolder) {
        folderSegments.shift();
      }
    }

    if (!folderSegments.length && defaultFolder) {
      folderSegments.push(this.normalizePathSegment(defaultFolder));
    }

    const pathSegments = [
      scopeFolder,
      ...folderSegments,
      ...segments.map((segment) => this.normalizePathSegment(segment)),
      this.normalizePathSegment(fileName),
    ].filter(Boolean);

    return pathSegments.join('/');
  }

  async getConfig(): Promise<BunnyStorageConfig> {
    const [globalSetting] = await this.globalSettingRepository.find({
      order: { id: 'ASC' },
      take: 1,
    });
    const zoneName =
      globalSetting?.bunnyStorageZoneName ||
      this.configService.get<string>('BUNNY_STORAGE_ZONE_NAME') ||
      '';
    const accessKey =
      globalSetting?.bunnyStorageAccessKey ||
      this.configService.get<string>('BUNNY_STORAGE_ACCESS_KEY') ||
      '';
    const publicBaseUrl = this.normalizePublicUrl(
      globalSetting?.bunnyStorageCdnDomain ||
        globalSetting?.bunnyStorageBaseUrl ||
        this.configService.get<string>('BUNNY_STORAGE_CDN_DOMAIN') ||
        this.configService.get<string>('BUNNY_STORAGE_BASE_URL') ||
        '',
    );

    if (!zoneName.trim() || !accessKey.trim() || !publicBaseUrl) {
      throw new BadRequestException(
        'Configure BUNNY_STORAGE_ZONE_NAME, BUNNY_STORAGE_ACCESS_KEY e BUNNY_STORAGE_CDN_DOMAIN/BUNNY_STORAGE_BASE_URL no ambiente antes de enviar arquivos.',
      );
    }

    return {
      zoneName: zoneName.trim(),
      accessKey: accessKey.trim(),
      publicBaseUrl,
      userFolder:
        globalSetting?.bunnyStorageUserFolder ||
        this.configService.get<string>('BUNNY_STORAGE_USER_FOLDER') ||
        'users',
      logoFolder:
        globalSetting?.bunnyStorageLogoFolder ||
        this.configService.get<string>('BUNNY_STORAGE_LOGO_FOLDER') ||
        'logos',
    };
  }

  async upload(
    storagePath: string,
    file: UploadedStorageFile,
    tenantId?: number,
  ): Promise<string> {
    const config = await this.getConfig(tenantId);
    const cleanPath = storagePath.replace(/^\/+/, '');
    const uploadUrl = `https://storage.bunnycdn.com/${config.zoneName}/${cleanPath}`;
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
        `Nao foi possivel enviar o arquivo para Bunny Storage. ${body || response.statusText}`,
      );
    }

    return `${config.publicBaseUrl}/${cleanPath}`;
  }

  async deleteByUrl(publicUrl?: string | null, tenantId?: number): Promise<void> {
    if (!publicUrl) {
      return;
    }

    const config = await this.getConfig(tenantId);
    const storagePath = this.getStoragePathFromPublicUrl(
      publicUrl,
      config.publicBaseUrl,
    );

    if (!storagePath) {
      return;
    }

    const deleteUrl = `https://storage.bunnycdn.com/${config.zoneName}/${storagePath}`;
    const response = await fetch(deleteUrl, {
      method: 'DELETE',
      headers: {
        AccessKey: config.accessKey,
      },
    });

    if (!response.ok && response.status !== 404) {
      const body = await response.text().catch(() => '');
      throw new BadRequestException(
        `Nao foi possivel apagar o arquivo antigo da Bunny Storage. ${body || response.statusText}`,
      );
    }
  }
}
