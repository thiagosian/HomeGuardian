const {
  restoreFileSchema,
  restoreItemSchema,
  historyQuerySchema,
  settingKeySchema,
  createSettingSchema,
  remoteConfigSchema
} = require('../../../validation/schemas');

describe('Validation Schemas', () => {
  describe('restoreFileSchema', () => {
    test('should accept valid file restore data', async () => {
      const validData = {
        filePath: 'config/automations.yaml',
        commitHash: 'a'.repeat(40)
      };

      const result = await restoreFileSchema.parseAsync(validData);
      expect(result).toEqual(validData);
    });

    test('should reject path traversal attempts', async () => {
      const invalidData = {
        filePath: '../../../etc/passwd',
        commitHash: 'a'.repeat(40)
      };

      await expect(restoreFileSchema.parseAsync(invalidData))
        .rejects
        .toThrow('Path traversal not allowed');
    });

    test('should reject invalid commit hash', async () => {
      const invalidData = {
        filePath: 'config/test.yaml',
        commitHash: 'short'
      };

      await expect(restoreFileSchema.parseAsync(invalidData))
        .rejects
        .toThrow('Commit hash must be 40 characters');
    });

    test('should reject non-hexadecimal commit hash', async () => {
      const invalidData = {
        filePath: 'config/test.yaml',
        commitHash: 'z'.repeat(40)
      };

      await expect(restoreFileSchema.parseAsync(invalidData))
        .rejects
        .toThrow('Invalid commit hash format');
    });
  });

  describe('restoreItemSchema', () => {
    test('should accept valid automation restore', async () => {
      const validData = {
        id: 'my_automation',
        type: 'automation',
        commitHash: 'a'.repeat(40)
      };

      const result = await restoreItemSchema.parseAsync(validData);
      expect(result).toEqual(validData);
    });

    test('should accept all valid item types', async () => {
      const types = ['automation', 'script', 'scene'];

      for (const type of types) {
        const data = {
          id: 'test_item',
          type,
          commitHash: 'a'.repeat(40)
        };

        const result = await restoreItemSchema.parseAsync(data);
        expect(result.type).toBe(type);
      }
    });

    test('should reject invalid item type', async () => {
      const invalidData = {
        id: 'test',
        type: 'invalid_type',
        commitHash: 'a'.repeat(40)
      };

      await expect(restoreItemSchema.parseAsync(invalidData))
        .rejects
        .toThrow();
    });
  });

  describe('historyQuerySchema', () => {
    test('should apply default values', async () => {
      const result = await historyQuerySchema.parseAsync({});

      expect(result.limit).toBe(50);
      expect(result.offset).toBe(0);
    });

    test('should coerce string numbers to integers', async () => {
      const data = {
        limit: '25',
        offset: '10'
      };

      const result = await historyQuerySchema.parseAsync(data);
      expect(result.limit).toBe(25);
      expect(result.offset).toBe(10);
    });

    test('should enforce maximum limit', async () => {
      const data = { limit: 200 };

      await expect(historyQuerySchema.parseAsync(data))
        .rejects
        .toThrow('Limit cannot exceed 100');
    });

    test('should reject negative offset', async () => {
      const data = { offset: -5 };

      await expect(historyQuerySchema.parseAsync(data))
        .rejects
        .toThrow('Offset cannot be negative');
    });
  });

  describe('settingKeySchema', () => {
    test('should accept valid lowercase keys', async () => {
      const validKeys = ['my_setting', 'test_key_123', 'config_value'];

      for (const key of validKeys) {
        const result = await settingKeySchema.parseAsync(key);
        expect(result).toBe(key);
      }
    });

    test('should reject uppercase keys', async () => {
      await expect(settingKeySchema.parseAsync('MyKey'))
        .rejects
        .toThrow('Key must be lowercase');
    });

    test('should reject keys starting with numbers', async () => {
      await expect(settingKeySchema.parseAsync('1_key'))
        .rejects
        .toThrow('Key must be lowercase');
    });

    test('should reject keys with special characters', async () => {
      await expect(settingKeySchema.parseAsync('my-key'))
        .rejects
        .toThrow('Key must be lowercase');
    });
  });

  describe('createSettingSchema', () => {
    test('should accept valid setting creation', async () => {
      const validData = {
        key: 'test_setting',
        value: 'test_value',
        encrypted: false
      };

      const result = await createSettingSchema.parseAsync(validData);
      expect(result).toEqual(validData);
    });

    test('should default encrypted to false', async () => {
      const data = {
        key: 'test_key',
        value: 'test_value'
      };

      const result = await createSettingSchema.parseAsync(data);
      expect(result.encrypted).toBe(false);
    });

    test('should enforce value length limit', async () => {
      const data = {
        key: 'test_key',
        value: 'x'.repeat(10001)
      };

      await expect(createSettingSchema.parseAsync(data))
        .rejects
        .toThrow('Value too long');
    });
  });

  describe('remoteConfigSchema', () => {
    test('should accept valid SSH remote', async () => {
      const validData = {
        remoteUrl: 'git@github.com:user/repo.git',
        authType: 'ssh'
      };

      const result = await remoteConfigSchema.parseAsync(validData);
      expect(result).toEqual(validData);
    });

    test('should accept valid token auth with token', async () => {
      const validData = {
        remoteUrl: 'https://github.com/user/repo.git',
        authType: 'token',
        token: 'ghp_1234567890'
      };

      const result = await remoteConfigSchema.parseAsync(validData);
      expect(result).toEqual(validData);
    });

    test('should reject token auth without token', async () => {
      const invalidData = {
        remoteUrl: 'https://github.com/user/repo.git',
        authType: 'token'
      };

      await expect(remoteConfigSchema.parseAsync(invalidData))
        .rejects
        .toThrow('Token is required when authType is "token"');
    });

    test('should reject invalid auth type', async () => {
      const invalidData = {
        remoteUrl: 'git@github.com:user/repo.git',
        authType: 'invalid'
      };

      await expect(remoteConfigSchema.parseAsync(invalidData))
        .rejects
        .toThrow();
    });
  });
});
