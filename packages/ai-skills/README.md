# AI Skills for VPP Project

This directory contains Claude Code skills for standardizing workflows in the VPP (Virtual Power Plant) Dashboard project.

## Available Skills

### test-infrastructure-setup

Sets up comprehensive test infrastructure with Vitest, TypeScript, Prisma, and GitHub Actions integration.

**Use when:**

- Setting up testing infrastructure from scratch
- Organizing scattered test files
- Creating integration tests for APIs and database
- Consolidating type definitions
- Adding test automation to CI/CD

**What it does:**

1. Consolidates types into centralized directory
2. Creates organized test structure (unit/integration/e2e)
3. Sets up Vitest with proper configuration
4. Creates test utilities and mock data generators
5. Configures GitHub Actions with PostgreSQL service
6. Fixes common TypeScript and linting issues

## Usage

Skills are automatically detected by Claude Code. Simply ask Claude to perform tasks related to the skill's purpose, and it will use the appropriate skill.

Example prompts:

- "Set up test infrastructure for this project"
- "Create integration tests for the auth API"
- "Organize my test files and consolidate types"

## Adding New Skills

Follow the skill structure:

```
your-skill-name/
├── SKILL.md          # Required - Main skill file with YAML frontmatter
├── scripts/          # Optional - Executable code
├── references/       # Optional - Reference docs
└── assets/          # Optional - Templates, fonts, icons
```

See individual skill directories for examples.
