const crypto = require('../../../utils/crypto-manager');

describe('CryptoManager', () => {
  describe('generateKey', () => {
    it('should generate a 64-character hex string', () => {
      const key = crypto.generateKey();
      expect(key).toHaveLength(64);
      expect(key).toMatch(/^[0-9a-f]{64}$/);
    });

    it('should generate unique keys', () => {
      const key1 = crypto.generateKey();
      const key2 = crypto.generateKey();
      expect(key1).not.toBe(key2);
    });
  });

  describe('encrypt/decrypt', () => {
    let testKey;

    beforeEach(() => {
      testKey = crypto.generateKey();
    });

    it('should encrypt and decrypt correctly', () => {
      const plaintext = 'sensitive data 123';
      const encrypted = crypto.encrypt(plaintext, testKey);

      expect(encrypted).not.toBe(plaintext);
      expect(encrypted).toBeTruthy();

      const decrypted = crypto.decrypt(encrypted, testKey);
      expect(decrypted).toBe(plaintext);
    });

    it('should produce different ciphertext for same plaintext (random IV)', () => {
      const plaintext = 'test';
      const encrypted1 = crypto.encrypt(plaintext, testKey);
      const encrypted2 = crypto.encrypt(plaintext, testKey);

      expect(encrypted1).not.toBe(encrypted2);
      expect(crypto.decrypt(encrypted1, testKey)).toBe(plaintext);
      expect(crypto.decrypt(encrypted2, testKey)).toBe(plaintext);
    });

    it('should fail with wrong key', () => {
      const key1 = crypto.generateKey();
      const key2 = crypto.generateKey();
      const plaintext = 'secret';

      const encrypted = crypto.encrypt(plaintext, key1);

      expect(() => {
        crypto.decrypt(encrypted, key2);
      }).toThrow();
    });

    it('should handle unicode characters', () => {
      const plaintext = '🔐 Dados sensíveis! 你好';
      const encrypted = crypto.encrypt(plaintext, testKey);
      const decrypted = crypto.decrypt(encrypted, testKey);

      expect(decrypted).toBe(plaintext);
    });

    it('should handle empty string', () => {
      expect(() => {
        crypto.encrypt('', testKey);
      }).toThrow('Plaintext is required');
    });

    it('should reject invalid key length', () => {
      expect(() => {
        crypto.encrypt('test', 'short');
      }).toThrow('Invalid key length');
    });

    it('should handle large data', () => {
      const largeData = 'x'.repeat(10000);
      const encrypted = crypto.encrypt(largeData, testKey);
      const decrypted = crypto.decrypt(encrypted, testKey);

      expect(decrypted).toBe(largeData);
    });
  });

  describe('hash', () => {
    it('should create consistent hash', () => {
      const data = 'test data';
      const hash1 = crypto.hash(data);
      const hash2 = crypto.hash(data);

      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64); // SHA-256 = 64 hex chars
    });

    it('should create different hashes for different data', () => {
      const hash1 = crypto.hash('data1');
      const hash2 = crypto.hash('data2');

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('verifyHash', () => {
    it('should verify correct hash', () => {
      const plaintext = 'password123';
      const hash = crypto.hash(plaintext);

      expect(crypto.verifyHash(plaintext, hash)).toBe(true);
    });

    it('should reject incorrect hash', () => {
      const plaintext = 'password123';
      const hash = crypto.hash('different');

      expect(crypto.verifyHash(plaintext, hash)).toBe(false);
    });
  });

  describe('deriveKey', () => {
    it('should derive same key from same password and salt', () => {
      const password = 'myPassword123';
      const result1 = crypto.deriveKey(password);
      const result2 = crypto.deriveKey(password, result1.salt);

      expect(result1.key).toBe(result2.key);
      expect(result1.salt).toBe(result2.salt);
    });

    it('should derive different keys from different passwords', () => {
      const result1 = crypto.deriveKey('password1');
      const result2 = crypto.deriveKey('password2');

      expect(result1.key).not.toBe(result2.key);
    });

    it('should return 64-char hex key and 32-char hex salt', () => {
      const result = crypto.deriveKey('test');

      expect(result.key).toHaveLength(64);
      expect(result.key).toMatch(/^[0-9a-f]{64}$/);
      expect(result.salt).toHaveLength(32);
      expect(result.salt).toMatch(/^[0-9a-f]{32}$/);
    });
  });

  describe('generateToken', () => {
    it('should generate random token', () => {
      const token = crypto.generateToken();

      expect(token).toBeTruthy();
      expect(token).toHaveLength(64); // 32 bytes = 64 hex chars
      expect(token).toMatch(/^[0-9a-f]{64}$/);
    });

    it('should generate unique tokens', () => {
      const token1 = crypto.generateToken();
      const token2 = crypto.generateToken();

      expect(token1).not.toBe(token2);
    });

    it('should accept custom length', () => {
      const token = crypto.generateToken(16);

      expect(token).toHaveLength(32); // 16 bytes = 32 hex chars
    });
  });
});
