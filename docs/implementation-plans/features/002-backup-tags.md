# Implementation Plan: Backup Tags and Labels

## Metadata

| Field | Value |
|-------|-------|
| **Plan ID** | FEAT-002 |
| **Status** | 🟢 MEDIUM PRIORITY |
| **Priority** | P2 |
| **Effort** | 3 hours |
| **Owner** | TBD |
| **Created** | 2025-11-07 |
| **Target Version** | v1.1.0 |

## Summary

Allow users to tag/label important commits (e.g., "Stable Config", "Before Update", "Working Automations") for easy identification and quick restoration.

## Motivation

### User Stories
- "I want to mark my config before upgrading Home Assistant"
- "I need to find my last stable automation configuration"
- "I want to tag backups for different testing phases"

## Technical Design

### Database Schema

```sql
CREATE TABLE backup_tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  commit_hash TEXT NOT NULL,
  tag_name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#1976d2',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(commit_hash, tag_name),
  FOREIGN KEY (commit_hash) REFERENCES backup_history(commit_hash) ON DELETE CASCADE
);

CREATE INDEX idx_backup_tags_commit ON backup_tags(commit_hash);
CREATE INDEX idx_backup_tags_name ON backup_tags(tag_name);
```

### Predefined Tag Templates

```javascript
const TAG_TEMPLATES = [
  { name: 'Stable', color: '#4caf50', description: 'Stable working configuration' },
  { name: 'Before Update', color: '#ff9800', description: 'Backup before system update' },
  { name: 'Testing', color: '#2196f3', description: 'Testing configuration' },
  { name: 'Production', color: '#f44336', description: 'Production-ready config' },
  { name: 'Backup', color: '#9e9e9e', description: 'Safety backup' }
];
```

## Implementation

### Backend (1.5 hours)

**File:** `backend/routes/tags.js`

```javascript
const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { validate } = require('../middleware/validate');
const { z } = require('zod');

const createTagSchema = z.object({
  tagName: z.string().min(1).max(50),
  description: z.string().max(200).optional(),
  color: z.string().regex(/^#[0-9a-f]{6}$/i).optional()
});

/**
 * POST /api/history/:commitHash/tags
 * Add tag to commit
 */
router.post('/:commitHash/tags', validate(createTagSchema), async (req, res) => {
  try {
    const { commitHash } = req.params;
    const { tagName, description, color } = req.body;

    await db.run(
      `INSERT OR REPLACE INTO backup_tags (commit_hash, tag_name, description, color)
       VALUES (?, ?, ?, ?)`,
      [commitHash, tagName, description, color || '#1976d2']
    );

    res.json({
      success: true,
      message: 'Tag added',
      tag: { tagName, description, color }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/history/:commitHash/tags
 * Get tags for commit
 */
router.get('/:commitHash/tags', async (req, res) => {
  try {
    const { commitHash } = req.params;

    const tags = await db.all(
      'SELECT * FROM backup_tags WHERE commit_hash = ?',
      [commitHash]
    );

    res.json({ success: true, tags });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/history/:commitHash/tags/:tagName
 * Remove tag from commit
 */
router.delete('/:commitHash/tags/:tagName', async (req, res) => {
  try {
    const { commitHash, tagName } = req.params;

    await db.run(
      'DELETE FROM backup_tags WHERE commit_hash = ? AND tag_name = ?',
      [commitHash, tagName]
    );

    res.json({ success: true, message: 'Tag removed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/tags
 * Get all tags with commit count
 */
router.get('/', async (req, res) => {
  try {
    const tags = await db.all(`
      SELECT tag_name, color, COUNT(*) as count
      FROM backup_tags
      GROUP BY tag_name, color
      ORDER BY count DESC
    `);

    res.json({ success: true, tags });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

### Frontend (1.5 hours)

**File:** `frontend/src/components/TagChip.jsx`

```jsx
import { Chip } from '@mui/material';
import { LocalOffer as TagIcon } from '@mui/icons-material';

export default function TagChip({ tag, onDelete }) {
  return (
    <Chip
      icon={<TagIcon />}
      label={tag.tag_name}
      size="small"
      sx={{
        backgroundColor: tag.color,
        color: '#fff',
        '& .MuiChip-icon': { color: '#fff' }
      }}
      onDelete={onDelete}
    />
  );
}
```

**File:** `frontend/src/components/AddTagDialog.jsx`

```jsx
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Box
} from '@mui/material';
import { useState } from 'react';
import { api } from '../api/client';

const TAG_TEMPLATES = [
  { name: 'Stable', color: '#4caf50' },
  { name: 'Before Update', color: '#ff9800' },
  { name: 'Testing', color: '#2196f3' },
  { name: 'Production', color: '#f44336' }
];

export default function AddTagDialog({ open, onClose, commitHash }) {
  const [tagName, setTagName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#1976d2');

  const handleSubmit = async () => {
    try {
      await api.history.addTag(commitHash, { tagName, description, color });
      onClose(true);
    } catch (error) {
      console.error('Failed to add tag:', error);
    }
  };

  return (
    <Dialog open={open} onClose={() => onClose(false)}>
      <DialogTitle>Add Tag</DialogTitle>
      <DialogContent>
        <TextField
          label="Tag Name"
          value={tagName}
          onChange={(e) => setTagName(e.target.value)}
          fullWidth
          margin="normal"
        />

        <TextField
          label="Description (Optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          fullWidth
          margin="normal"
          multiline
          rows={2}
        />

        <Box mt={2}>
          <Typography variant="subtitle2" gutterBottom>
            Quick Templates:
          </Typography>
          <Grid container spacing={1}>
            {TAG_TEMPLATES.map((template) => (
              <Grid item key={template.name}>
                <Chip
                  label={template.name}
                  onClick={() => {
                    setTagName(template.name);
                    setColor(template.color);
                  }}
                  sx={{ backgroundColor: template.color, color: '#fff' }}
                />
              </Grid>
            ))}
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => onClose(false)}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained">
          Add Tag
        </Button>
      </DialogActions>
    </Dialog>
  );
}
```

## Testing

```javascript
describe('Tags API', () => {
  test('should add tag to commit', async () => {
    const response = await request(app)
      .post('/api/history/abc123/tags')
      .send({ tagName: 'Stable', description: 'Working config' })
      .expect(200);

    expect(response.body.success).toBe(true);
  });

  test('should get tags for commit', async () => {
    const response = await request(app)
      .get('/api/history/abc123/tags')
      .expect(200);

    expect(response.body.tags).toHaveLength(1);
  });
});
```

---

**Status:** ✅ Ready for Implementation
