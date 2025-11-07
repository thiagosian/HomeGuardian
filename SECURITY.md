# Security Policy

## Encryption

### Encryption Key Management

HomeGuardian uses AES-256 encryption to protect sensitive data including:
- SSH private keys
- Personal Access Tokens (PAT)
- Other sensitive settings

**Key Generation:**
- On first startup, HomeGuardian automatically generates a secure 256-bit (32-byte) encryption key
- The key is stored in `/data/.encryption_key` with restrictive permissions (600)
- The key is unique per installation and never shared

**Key Storage:**
```
Location: /data/.encryption_key
Permissions: 600 (owner read/write only)
Format: 64-character hexadecimal string
```

**Backup Recommendations:**
- Back up your `/data` directory regularly
- The encryption key is critical - without it, encrypted data cannot be recovered
- Consider storing a backup of the key in a secure location (password manager, encrypted backup)

### Migration from v1.0.0

If upgrading from v1.0.0, the encryption key migration happens automatically on first startup with v1.0.1+.

**Automatic Migration:**
- Detects encrypted data using the old default key
- Re-encrypts all data with the new secure key
- Logs migration progress

**Manual Migration:**
If you used a custom `ENCRYPTION_KEY` environment variable in v1.0.0:

```bash
# Set your old key
export OLD_ENCRYPTION_KEY="your-old-key"

# Run migration
cd /app/backend
node scripts/migrate-encryption-key.js
```

### Best Practices

1. **Never share your encryption key**
2. **Back up `/data` directory regularly**
3. **Do not commit `.encryption_key` to version control** (already in .gitignore)
4. **Restrict access to the `/data` directory**
5. **Use SSH keys instead of tokens when possible**

## Secrets Management

### Excluded by Default

The following sensitive files are excluded from Git backups by default:
- `secrets.yaml` (configurable via `exclude_secrets` option)
- `*.db`, `*.db-journal` (database files)
- `*.log` (log files)
- `.cloud/`, `.google.token` (cloud credentials)
- SSL certificates

### Custom Exclusions

Edit your `.gitignore` file to exclude additional sensitive files.

## Reporting a Vulnerability

If you discover a security vulnerability in HomeGuardian, please report it responsibly:

1. **Do NOT open a public GitHub issue**
2. Email security details to: [maintainer email - TBD]
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

### Response Timeline

- **Acknowledgment:** Within 48 hours
- **Initial assessment:** Within 7 days
- **Fix development:** Depends on severity
  - Critical: 7-14 days
  - High: 14-30 days
  - Medium: 30-60 days
  - Low: 60-90 days

### Disclosure Policy

- We will coordinate disclosure with the reporter
- Public disclosure only after a fix is available
- Credit will be given to the reporter (if desired)

## Security Updates

### How to Stay Informed

- Watch the GitHub repository for releases
- Subscribe to release notifications
- Check CHANGELOG.md for security-related updates

### Update Recommendations

- **Critical updates:** Apply immediately
- **High priority:** Apply within 7 days
- **Medium priority:** Apply within 30 days

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.1+  | ✅ Yes             |
| 1.0.0   | ⚠️ Critical vulnerability - upgrade immediately |
| < 1.0.0 | ❌ No              |

## Security Features

### Authentication

- Leverages Home Assistant's native authentication
- No custom authentication layer required
- Access controlled by HA user permissions

### Authorization

- Supervisor API access: "manager" role (not admin)
- Read-only access to SSL directory
- No direct file system access outside `/config` and `/data`

### Network Security

- HTTPS enforced by Home Assistant Ingress
- No direct external network exposure required
- All communication through HA proxy

### Input Validation

- All API inputs validated (v1.0.1+)
- SQL injection protection via parameterized queries
- Path traversal prevention in file operations
- Request size limits enforced

### Rate Limiting

- API rate limits to prevent abuse (v1.0.1+)
- Different limits for different endpoint types
- Automatic throttling of excessive requests

## Known Issues

### Current Version (v1.0.1)

No known security issues.

### Historical Issues

#### v1.0.0 - Default Encryption Key (CRITICAL)

**Vulnerability:** Default encryption key hardcoded in source code
**CVSS Score:** 8.1 (HIGH)
**Status:** ✅ Fixed in v1.0.1
**Recommendation:** Upgrade immediately

## Security Checklist for Users

- [ ] Running v1.0.1 or later
- [ ] Encryption key automatically generated (check logs)
- [ ] `/data` directory backed up
- [ ] `exclude_secrets` enabled (if using secrets.yaml)
- [ ] Remote repository uses SSH keys (not tokens)
- [ ] Home Assistant authentication enabled
- [ ] Add-on not exposed to public internet (use HA security)

## Advanced Security

### Encryption Key Rotation

For maximum security, encryption keys can be rotated periodically:

```javascript
// This feature is planned for future release
// Manual rotation requires re-encryption of all data
```

### Audit Logging

Enable audit logging to track all configuration changes:

```yaml
# Planned for future release
audit_logging:
  enabled: true
  retention_days: 90
```

### Multi-Factor Authentication

MFA is handled by Home Assistant's authentication system. Enable MFA in HA settings for additional security.

## Compliance

### GDPR Compliance

- All data stored locally on your Home Assistant instance
- No data transmitted to third parties (except configured Git remotes)
- Data deletion: Remove add-on to delete all data

### Data Encryption

- Sensitive data encrypted at rest (AES-256)
- Git repository data not encrypted (consider Git-crypt for additional protection)

## Additional Resources

- [OWASP Key Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Key_Management_Cheat_Sheet.html)
- [Home Assistant Security Best Practices](https://www.home-assistant.io/docs/configuration/securing/)
- [Git Security Documentation](https://git-scm.com/book/en/v2/Git-on-the-Server-Securing-Git)

---

**Last Updated:** 2025-11-07
**Version:** 1.0.1
