const { z } = require('zod');

// Common patterns
const hexString = z.string().regex(/^[0-9a-f]+$/i, 'Must be hexadecimal');
const gitUrl = z.string().url().or(
  z.string().regex(/^git@[\w\.-]+:[\w\.-]+\/[\w\.-]+\.git$/, 'Invalid Git URL')
);

// Settings schemas
const settingKeySchema = z.string()
  .min(1, 'Key cannot be empty')
  .max(100, 'Key too long')
  .regex(/^[a-z_][a-z0-9_]*$/, 'Key must be lowercase letters, numbers, and underscores');

const settingValueSchema = z.string()
  .max(10000, 'Value too long (max 10KB)');

const createSettingSchema = z.object({
  key: settingKeySchema,
  value: settingValueSchema,
  encrypted: z.boolean().optional().default(false)
});

const updateSettingSchema = z.object({
  value: settingValueSchema,
  encrypted: z.boolean().optional()
});

// Backup schemas
const createBackupSchema = z.object({
  message: z.string()
    .min(1, 'Message cannot be empty')
    .max(500, 'Message too long')
    .optional()
});

// Remote configuration schemas
const remoteConfigSchema = z.object({
  remoteUrl: gitUrl,
  authType: z.enum(['ssh', 'token'], {
    errorMap: () => ({ message: 'Auth type must be "ssh" or "token"' })
  }),
  token: z.string()
    .min(1, 'Token cannot be empty')
    .max(1000, 'Token too long')
    .optional()
}).refine(
  data => data.authType !== 'token' || data.token,
  {
    message: 'Token is required when authType is "token"',
    path: ['token']
  }
);

// Restore schemas
const restoreFileSchema = z.object({
  filePath: z.string()
    .min(1, 'File path cannot be empty')
    .regex(/^[a-zA-Z0-9_\-\/\.]+$/, 'Invalid file path characters')
    .refine(path => !path.includes('..'), 'Path traversal not allowed'),
  commitHash: z.string()
    .length(40, 'Commit hash must be 40 characters')
    .regex(/^[0-9a-f]{40}$/i, 'Invalid commit hash format')
});

const restoreItemSchema = z.object({
  id: z.string().min(1, 'Item ID cannot be empty'),
  type: z.enum(['automation', 'script', 'scene']),
  commitHash: z.string()
    .length(40, 'Commit hash must be 40 characters')
    .regex(/^[0-9a-f]{40}$/i, 'Invalid commit hash format')
});

// History schemas
const historyQuerySchema = z.object({
  limit: z.coerce.number()
    .int('Limit must be an integer')
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit cannot exceed 100')
    .optional()
    .default(50),
  offset: z.coerce.number()
    .int('Offset must be an integer')
    .min(0, 'Offset cannot be negative')
    .optional()
    .default(0),
  search: z.string()
    .max(200, 'Search query too long')
    .optional(),
  type: z.enum(['all', 'manual', 'auto', 'scheduled'])
    .optional()
    .default('all'),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional()
}).refine(
  data => !data.dateFrom || !data.dateTo || data.dateFrom <= data.dateTo,
  {
    message: 'dateFrom must be before dateTo',
    path: ['dateFrom']
  }
);

const filePathQuerySchema = z.object({
  filePath: z.string()
    .min(1, 'File path cannot be empty')
    .regex(/^[a-zA-Z0-9_\-\/\.]+$/, 'Invalid file path characters')
    .refine(path => !path.includes('..'), 'Path traversal not allowed')
});

// SSH key generation
const sshKeyGenerateSchema = z.object({
  keyType: z.enum(['rsa', 'ed25519']).optional().default('rsa'),
  keySize: z.number()
    .int()
    .min(2048)
    .max(4096)
    .optional()
    .default(4096)
});

// Git user config
const gitUserConfigSchema = z.object({
  userName: z.string()
    .min(1, 'User name cannot be empty')
    .max(100, 'User name too long'),
  userEmail: z.string()
    .email('Invalid email format')
    .max(200, 'Email too long')
});

// Reload domain schema
const reloadDomainSchema = z.object({
  domain: z.enum(['automation', 'script', 'scene', 'group', 'core'], {
    errorMap: () => ({ message: 'Invalid domain. Must be: automation, script, scene, group, or core' })
  })
});

module.exports = {
  // Settings
  createSettingSchema,
  updateSettingSchema,

  // Backup
  createBackupSchema,

  // Remote
  remoteConfigSchema,

  // Restore
  restoreFileSchema,
  restoreItemSchema,

  // History
  historyQuerySchema,
  filePathQuerySchema,

  // SSH
  sshKeyGenerateSchema,

  // Git
  gitUserConfigSchema,

  // Reload
  reloadDomainSchema,

  // Common
  hexString,
  gitUrl,
  settingKeySchema,
  settingValueSchema
};
