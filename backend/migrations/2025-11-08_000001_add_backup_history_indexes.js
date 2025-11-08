/**
 * Migration: Add performance indexes to backup_history table
 * Date: 2025-11-08
 */

module.exports = {
  async up(db) {
    // Add indexes for commonly queried columns
    await db.run('CREATE INDEX IF NOT EXISTS idx_backup_history_push_status ON backup_history(push_status)');
    await db.run('CREATE INDEX IF NOT EXISTS idx_backup_history_is_auto ON backup_history(is_auto)');
    await db.run('CREATE INDEX IF NOT EXISTS idx_backup_history_commit_date ON backup_history(commit_date DESC)');
    
    console.log('✓ Added backup_history performance indexes');
  },

  async down(db) {
    // Rollback: Remove indexes
    await db.run('DROP INDEX IF EXISTS idx_backup_history_push_status');
    await db.run('DROP INDEX IF EXISTS idx_backup_history_is_auto');
    await db.run('DROP INDEX IF EXISTS idx_backup_history_commit_date');
    
    console.log('✓ Removed backup_history performance indexes');
  }
};
