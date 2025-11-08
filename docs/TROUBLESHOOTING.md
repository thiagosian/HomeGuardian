# Troubleshooting Guide

## Table of Contents

1. [Installation Issues](#installation-issues)
2. [Startup Problems](#startup-problems)
3. [Git Operations](#git-operations)
4. [Remote Sync Issues](#remote-sync-issues)
5. [File Watcher Problems](#file-watcher-problems)
6. [Performance Issues](#performance-issues)
7. [Database Issues](#database-issues)
8. [Authentication Problems](#authentication-problems)
9. [Health Check Failures](#health-check-failures)
10. [Common Error Messages](#common-error-messages)

## Installation Issues

### Add-on Not Appearing in Home Assistant

**Symptoms:**
- HomeGuardian doesn't show up in the add-ons list

**Solutions:**

1. **Refresh add-on list:**
   ```bash
   # Settings → Add-ons → Check for updates (refresh icon)
   ```

2. **Check repository URL:**
   - Ensure `https://github.com/thiagosian/HomeGuardian` is added correctly
   - Category should be "Add-on"

3. **Restart Home Assistant:**
   ```bash
   # Settings → System → Restart
   ```

4. **Check logs:**
   ```bash
   # Settings → System → Logs → Supervisor
   ```

### Installation Fails

**Symptoms:**
- Installation starts but fails with error

**Solutions:**

1. **Check disk space:**
   ```bash
   df -h
   ```
   Ensure at least 1GB free space

2. **Check system logs:**
   ```bash
   # Settings → System → Logs → Supervisor
   ```

3. **Manual installation:**
   ```bash
   cd /addons
   git clone https://github.com/thiagosian/HomeGuardian.git
   ```

4. **Check permissions:**
   ```bash
   ls -la /addons
   chmod 755 /addons
   ```

## Startup Problems

### Add-on Won't Start

**Symptoms:**
- Add-on shows as "stopped" immediately after starting
- Red error icon in add-on card

**Solutions:**

1. **Check add-on logs:**
   ```
   Settings → Add-ons → HomeGuardian → Log tab
   ```

2. **Verify configuration:**
   - Ensure all required options are set
   - Check for syntax errors in YAML configuration

3. **Check port conflicts:**
   ```bash
   netstat -tulpn | grep 8099
   ```

4. **Verify data directory permissions:**
   ```bash
   ls -la /data
   chmod 755 /data
   ```

5. **Reset to defaults:**
   - Clear configuration and use defaults
   - Restart add-on

### Slow Startup

**Symptoms:**
- Add-on takes more than 2 minutes to start

**Possible Causes:**

1. **Large Git repository:**
   - Solution: Clean up old commits
   ```bash
   git gc --aggressive --prune=now
   ```

2. **Database corruption:**
   - Solution: See [Database Issues](#database-issues)

3. **Insufficient resources:**
   - Solution: Check system resources
   ```bash
   free -m
   top
   ```

## Git Operations

### "Git Not Initialized" Error

**Symptoms:**
```
Error: Git repository not initialized
```

**Solutions:**

1. **Check if `.git` directory exists:**
   ```bash
   ls -la /data/repo/.git
   ```

2. **Reinitialize Git:**
   - Settings → Advanced → "Reinitialize Git Repository"
   - Or manually:
   ```bash
   cd /data/repo
   rm -rf .git
   git init
   ```

3. **Check permissions:**
   ```bash
   chown -R root:root /data/repo
   chmod -R 755 /data/repo
   ```

### "No Changes to Commit" When Changes Exist

**Symptoms:**
- Files are modified but backup shows "no changes"

**Solutions:**

1. **Check if files are in `.gitignore`:**
   ```bash
   cat /data/repo/.gitignore
   ```

2. **Verify file paths:**
   - Ensure files are in monitored directory
   - Check watcher configuration

3. **Check Git status manually:**
   ```bash
   cd /data/repo
   git status
   git diff
   ```

4. **Force add files:**
   ```bash
   git add -f <file>
   ```

### "Detached HEAD" State

**Symptoms:**
```
You are in 'detached HEAD' state
```

**Solutions:**

1. **Return to main branch:**
   ```bash
   cd /data/repo
   git checkout main
   ```

2. **If main doesn't exist:**
   ```bash
   git checkout -b main
   ```

3. **Verify current branch:**
   ```bash
   git branch -a
   ```

### Large Repository Size

**Symptoms:**
- Repository growing very large (>1GB)

**Solutions:**

1. **Clean up old commits:**
   ```bash
   cd /data/repo
   git reflog expire --expire=30.days.ago --all
   git gc --aggressive --prune=now
   ```

2. **Check large files:**
   ```bash
   git rev-list --objects --all |
     git cat-file --batch-check='%(objecttype) %(objectname) %(objectsize) %(rest)' |
     sed -n 's/^blob //p' |
     sort --numeric-sort --key=2 |
     tail -20
   ```

3. **Add exclusions:**
   - Add large/unnecessary files to `.gitignore`
   - Common exclusions: `*.log`, `*.db`, `tts/`, `www/`

## Remote Sync Issues

### SSH Connection Failed

**Symptoms:**
```
Error: SSH authentication failed
Error: Permission denied (publickey)
```

**Solutions:**

1. **Verify SSH key:**
   - Settings → SSH Key section
   - Copy public key

2. **Check GitHub/GitLab:**
   - Ensure public key is added to repository
   - Verify "Write access" is enabled

3. **Test SSH connection:**
   ```bash
   ssh -T git@github.com
   # Should respond: "Hi username! You've successfully authenticated"
   ```

4. **Regenerate SSH key:**
   - Settings → "Generate New SSH Key"
   - Re-add to GitHub/GitLab

5. **Check SSH permissions:**
   ```bash
   ls -la /data/.ssh/
   chmod 600 /data/.ssh/id_rsa
   chmod 644 /data/.ssh/id_rsa.pub
   ```

### Push Failed: "Updates Were Rejected"

**Symptoms:**
```
Error: Updates were rejected because the remote contains work that you do not have locally
```

**Solutions:**

1. **Pull before push:**
   ```bash
   cd /data/repo
   git pull --rebase origin main
   git push origin main
   ```

2. **Force push (CAUTION):**
   ```bash
   # Only if you're sure local is correct
   git push --force origin main
   ```

3. **Create new branch:**
   ```bash
   git checkout -b backup-$(date +%Y%m%d)
   git push origin backup-$(date +%Y%m%d)
   ```

### Push Failed: "Repository Not Found"

**Symptoms:**
```
Error: Repository not found
Error: Could not read from remote repository
```

**Solutions:**

1. **Verify repository URL:**
   - Must be SSH format: `git@github.com:user/repo.git`
   - NOT HTTPS: `https://github.com/user/repo.git`

2. **Check repository exists:**
   - Login to GitHub/GitLab
   - Verify repository is created

3. **Check permissions:**
   - Ensure you have write access to repository

4. **Update remote URL:**
   ```bash
   cd /data/repo
   git remote set-url origin git@github.com:user/repo.git
   ```

### Slow Push Operations

**Symptoms:**
- Push takes several minutes
- Timeout errors

**Solutions:**

1. **Reduce repository size:**
   - See [Large Repository Size](#large-repository-size)

2. **Check network:**
   ```bash
   ping github.com
   traceroute github.com
   ```

3. **Increase timeout:**
   ```bash
   git config http.postBuffer 524288000
   ```

## File Watcher Problems

### Changes Not Detected

**Symptoms:**
- File modifications don't trigger backups

**Solutions:**

1. **Check if watcher is running:**
   - Look for logs: "File watcher initialized"

2. **Verify debounce time:**
   - Settings → Auto Commit Debounce
   - Default: 60 seconds (wait at least this long)

3. **Check file path:**
   - Watcher monitors `/config` directory
   - Ensure files are in correct location

4. **Restart add-on:**
   - Settings → Add-ons → HomeGuardian → Restart

5. **Check file system events:**
   ```bash
   # Test if system supports file watching
   inotifywait -m /config
   ```

### Duplicate Commits

**Symptoms:**
- Multiple commits for single change
- Commits seconds apart with same message

**Solutions:**

1. **Increase debounce time:**
   - Settings → Auto Commit Debounce → 120 seconds

2. **Disable auto-commit temporarily:**
   - Settings → Auto Commit Enabled → false
   - Use manual backups

3. **Check for multiple watchers:**
   ```bash
   ps aux | grep chokidar
   # Should only see one instance
   ```

### High CPU Usage from Watcher

**Symptoms:**
- Constant high CPU usage
- System slow response

**Solutions:**

1. **Reduce watched files:**
   - Add exclusions to `.gitignore`
   - Common: `*.log`, `*.db`, `tts/*`, `www/*`

2. **Increase debounce time:**
   - Higher values = less CPU usage
   - Settings → Auto Commit Debounce → 300

3. **Check for file loops:**
   - Ensure HomeGuardian isn't watching its own data directory

## Performance Issues

### Slow Web Interface

**Symptoms:**
- UI takes long to load
- Operations timeout

**Solutions:**

1. **Check system resources:**
   ```bash
   free -m
   top -o %CPU
   ```

2. **Clear browser cache:**
   - Hard refresh: Ctrl+Shift+R (Cmd+Shift+R on Mac)

3. **Check network:**
   - Test direct connection vs. Ingress
   - `http://homeassistant.local:8099` vs Ingress URL

4. **Reduce commit history:**
   ```bash
   cd /data/repo
   git reflog expire --expire=30.days.ago --all
   git gc
   ```

### High Memory Usage

**Symptoms:**
- Add-on using >500MB memory
- Out of memory errors

**Solutions:**

1. **Check current usage:**
   ```bash
   ps aux | grep node
   ```

2. **Reduce cache size:**
   - Implemented cache has auto-cleanup
   - Check logs for cache statistics

3. **Limit commit history:**
   ```bash
   # Keep only last 100 commits
   git rev-list --max-count=100 HEAD | tail -1 | xargs git reset --hard
   ```

4. **Restart add-on:**
   - Fresh start clears memory

### Database Locked Errors

**Symptoms:**
```
Error: database is locked
SQLITE_BUSY
```

**Solutions:**

1. **Wait and retry:**
   - SQLite auto-retries failed operations

2. **Check for other processes:**
   ```bash
   lsof /data/homeguardian.db
   ```

3. **Increase timeout:**
   ```javascript
   // In database configuration
   busyTimeout: 10000  // 10 seconds
   ```

4. **Restart add-on:**
   - Releases all database locks

## Database Issues

### Database Corruption

**Symptoms:**
```
Error: database disk image is malformed
```

**Solutions:**

1. **Check integrity:**
   ```bash
   sqlite3 /data/homeguardian.db "PRAGMA integrity_check;"
   ```

2. **Recover database:**
   ```bash
   # Backup
   cp /data/homeguardian.db /data/homeguardian.db.corrupt

   # Export and reimport
   sqlite3 /data/homeguardian.db ".dump" | sqlite3 /data/homeguardian_new.db
   mv /data/homeguardian_new.db /data/homeguardian.db
   ```

3. **Restore from backup:**
   - If you have a backup, restore it
   - Otherwise, database will be recreated on restart

### Missing Database Tables

**Symptoms:**
```
Error: no such table: backups
```

**Solutions:**

1. **Check tables:**
   ```bash
   sqlite3 /data/homeguardian.db ".tables"
   ```

2. **Reinitialize database:**
   ```bash
   # Backup first
   mv /data/homeguardian.db /data/homeguardian.db.old

   # Restart add-on to recreate
   ```

3. **Run migrations:**
   ```bash
   cd /app/backend
   npm run migrate
   ```

## Authentication Problems

### "Unauthorized" Errors

**Symptoms:**
```
401 Unauthorized
Error: Authentication required
```

**Solutions:**

1. **Use Home Assistant Ingress:**
   - Access via sidebar, not direct URL

2. **Check headers:**
   ```bash
   # Should include X-Ingress-User header
   curl -I http://homeassistant.local:8123/api/hassio_ingress/xxx/api/status
   ```

3. **Verify supervisor token:**
   - Check environment variable `SUPERVISOR_TOKEN`

4. **Development mode:**
   ```yaml
   # In options.yaml (dev only)
   environment:
     DISABLE_AUTH: "true"
   ```

### Session Expired

**Symptoms:**
- Logged out unexpectedly
- Need to refresh frequently

**Solutions:**

1. **Use Ingress:**
   - Ingress handles authentication automatically

2. **Check browser cookies:**
   - Ensure cookies are enabled
   - Clear and retry

## Health Check Failures

### Liveness Probe Failing

**Symptoms:**
- Kubernetes restarts pod frequently
- `/api/health/live` returns 503

**Solutions:**

1. **Check application status:**
   ```bash
   curl http://localhost:8099/api/health/live
   ```

2. **Review logs:**
   ```bash
   kubectl logs -f deployment/homeguardian
   ```

3. **Increase initial delay:**
   ```yaml
   livenessProbe:
     initialDelaySeconds: 60  # Increase from 30
   ```

### Readiness Probe Failing

**Symptoms:**
- Pod not receiving traffic
- `/api/health/ready` returns 503

**Solutions:**

1. **Check database:**
   ```bash
   sqlite3 /data/homeguardian.db "SELECT 1;"
   ```

2. **Check disk space:**
   ```bash
   df -h /data
   ```

3. **Review detailed health:**
   ```bash
   curl http://localhost:8099/api/health
   ```

## Common Error Messages

### "Encryption key not found"

**Cause:** Encryption key file missing or inaccessible

**Solution:**
```bash
# Check if key exists
ls -la /data/.encryption_key

# If missing, will be regenerated on restart
# WARNING: You'll lose access to encrypted data
```

### "Failed to decrypt SSH key"

**Cause:** Encryption key changed or corrupted

**Solutions:**

1. **Restore encryption key from backup**

2. **Regenerate SSH key:**
   - Settings → Generate New SSH Key
   - Re-add to GitHub/GitLab

### "Command injection detected"

**Cause:** Unsafe characters in input

**Solution:**
- Remove special characters from input
- Only use: letters, numbers, hyphens, underscores

### "Rate limit exceeded"

**Cause:** Too many API requests

**Solution:**
```bash
# Wait 60 seconds and retry
# Headers show limit info:
# X-RateLimit-Limit: 100
# X-RateLimit-Reset: 1699459200
```

## Getting Help

If issues persist:

1. **Gather information:**
   ```bash
   # Add-on logs
   Settings → Add-ons → HomeGuardian → Log

   # System info
   Settings → System → About

   # Error messages (full text)
   ```

2. **Create GitHub issue:**
   - https://github.com/thiagosian/HomeGuardian/issues
   - Include: logs, system info, steps to reproduce

3. **Community help:**
   - GitHub Discussions: https://github.com/thiagosian/HomeGuardian/discussions
   - Home Assistant Community Forum

## Diagnostic Commands

### Full System Check

```bash
# Check HomeGuardian status
curl http://localhost:8099/api/health

# Check Git status
cd /data/repo && git status

# Check database
sqlite3 /data/homeguardian.db "PRAGMA integrity_check;"

# Check disk space
df -h

# Check memory
free -m

# Check processes
ps aux | grep node

# Check network
ping -c 3 github.com

# Check SSH
ssh -T git@github.com
```

### Log Collection

```bash
# Collect all relevant logs
mkdir -p /tmp/homeguardian-logs

# Add-on logs
cp /data/homeguardian.log /tmp/homeguardian-logs/

# Git log
cd /data/repo && git log --oneline -20 > /tmp/homeguardian-logs/git.log

# Database info
sqlite3 /data/homeguardian.db ".schema" > /tmp/homeguardian-logs/schema.sql

# System info
free -m > /tmp/homeguardian-logs/memory.txt
df -h > /tmp/homeguardian-logs/disk.txt

# Create archive
tar -czf homeguardian-diagnostics.tar.gz /tmp/homeguardian-logs/
```

Attach `homeguardian-diagnostics.tar.gz` to GitHub issue for faster support.
