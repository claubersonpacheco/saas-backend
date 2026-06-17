import { BunnyStorageService } from './bunny-storage.service';

describe('BunnyStorageService', () => {
  let service: BunnyStorageService;

  beforeEach(() => {
    service = new BunnyStorageService({} as never, {} as never);
  });

  describe('buildStoragePath', () => {
    it('stores central files inside the central folder', () => {
      expect(
        service.buildStoragePath({
          tenantId: 1,
          tenantFolder: 'central-code',
          tenantIsCentral: true,
          folder: 'logos',
          defaultFolder: 'logos',
          segments: ['white'],
          fileName: 'logo.svg',
        }),
      ).toBe('central/logos/white/logo.svg');
    });

    it('stores tenant files inside their tenant code folder', () => {
      expect(
        service.buildStoragePath({
          tenantId: 2,
          tenantFolder: '7F6A2B',
          tenantIsCentral: false,
          folder: 'logos',
          defaultFolder: 'logos',
          segments: ['icon'],
          fileName: 'logo.png',
        }),
      ).toBe('tenant/7f6a2b/logos/icon/logo.png');
    });

    it('normalizes legacy tenant folder prefixes before composing the final path', () => {
      expect(
        service.buildStoragePath({
          tenantId: 2,
          tenantFolder: 'tenant-code',
          tenantIsCentral: false,
          folder: 'tenant/tenant-code/logos',
          defaultFolder: 'logos',
          fileName: 'logo.png',
        }),
      ).toBe('tenant/tenant-code/logos/logo.png');
    });
  });
});
