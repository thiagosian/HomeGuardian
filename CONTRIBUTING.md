# Contributing to HomeGuardian

Thank you for your interest in contributing to HomeGuardian! We welcome contributions from the community.

## Development Setup

### Prerequisites

- Node.js 18+ and npm
- Docker (for building add-on images)
- Git
- Home Assistant instance (for testing)

### Local Development

#### Backend Development

```bash
cd backend
npm install
npm run dev
```

The backend server will start on port 8099.

#### Frontend Development

```bash
cd frontend
npm install
npm run dev
```

The frontend development server will start on port 3000 with hot module replacement.

### Environment Variables

Create a `.env` file in the `backend` directory:

```env
LOG_LEVEL=debug
CONFIG_PATH=/path/to/test/config
DATA_PATH=/path/to/test/data
AUTO_COMMIT_ENABLED=true
AUTO_COMMIT_DEBOUNCE=60
GIT_USER_NAME=HomeGuardian
GIT_USER_EMAIL=homeguardian@homeassistant.local
```

## Project Structure

```
HomeGuardian/
├── backend/              # Node.js/Express backend
│   ├── config/          # Database configuration
│   ├── routes/          # API routes
│   ├── services/        # Core services (Git, FileWatcher, etc.)
│   ├── utils/           # Utilities (logger, etc.)
│   └── server.js        # Main server file
├── frontend/            # React/Vite frontend
│   ├── src/
│   │   ├── api/        # API client
│   │   ├── components/ # React components
│   │   ├── locales/    # i18n translations
│   │   ├── pages/      # Page components
│   │   └── App.jsx     # Main app component
│   └── index.html
├── config.yaml          # Home Assistant add-on config
├── Dockerfile           # Docker build configuration
└── run.sh              # Add-on startup script
```

## Coding Standards

### Backend (JavaScript/Node.js)

- Use ES6+ features
- Use `async/await` for asynchronous operations
- Use proper error handling with try/catch
- Follow the existing code style
- Use meaningful variable and function names
- Add comments for complex logic

### Frontend (React)

- Use functional components with hooks
- Use Material-UI components for consistency
- Follow React best practices
- Use i18n for all user-facing strings
- Keep components small and focused

### Git Commit Messages

Follow the conventional commits specification:

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

Example:
```
feat: add SSH key generation to settings
fix: resolve file watcher memory leak
docs: update README with installation instructions
```

## Testing

### Manual Testing

1. Build the add-on locally
2. Install in your Home Assistant test instance
3. Test all features:
   - Auto-commit on file changes
   - Manual backup creation
   - History viewing
   - Diff comparison
   - Item restoration
   - Remote Git sync
   - Settings configuration

### Adding Tests

We welcome contributions that add automated testing:
- Backend unit tests (Jest)
- Frontend component tests (React Testing Library)
- Integration tests
- E2E tests

## Pull Request Process

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Test thoroughly
5. Commit your changes with descriptive commit messages
6. Push to your fork
7. Open a Pull Request

### PR Requirements

- Clear description of changes
- Link to related issues (if applicable)
- Screenshots/videos for UI changes
- Updated documentation (if needed)
- All checks passing

## Feature Requests

We use GitHub Issues for feature requests. Please:

1. Check if the feature has already been requested
2. Provide a clear description of the feature
3. Explain the use case and benefits
4. Include mockups or examples if applicable

## Bug Reports

When reporting bugs, please include:

1. HomeGuardian version
2. Home Assistant version
3. Steps to reproduce
4. Expected behavior
5. Actual behavior
6. Relevant logs (from add-on logs)
7. Screenshots if applicable

## Translation Contributions

We welcome translations to new languages!

1. Copy `frontend/src/locales/en.json` to `[language-code].json`
2. Translate all strings
3. Update `frontend/src/i18n.js` to include the new language
4. Test the translation in the UI
5. Submit a PR

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and grow
- Keep discussions on-topic

## Questions?

- Open a GitHub Discussion for general questions
- Open an issue for bugs or feature requests
- Check existing issues and discussions first

## License

By contributing to HomeGuardian, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to HomeGuardian! 🛡️
