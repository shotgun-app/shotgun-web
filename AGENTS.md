# AGENTS.md

This file defines the coding conventions and style guidelines for the `shotgun-web` project.

## Naming conventions

- Use `camelCase` for variables, functions, and methods.
- Use `PascalCase` for Vue components, classes, and types.
- Use `PascalCase` for Vue component filenames (e.g. `UserProfile.vue`).
- Prefix composables with `use` (e.g. `useAuth.ts`).
- Use descriptive names and avoid unnecessary abbreviations.

## Code style

- Format code with Prettier using the repository's `.prettierrc`.
- Run `npm run format` to format the project.
- Keep functions and components small and focused.
- Prefer early returns over deeply nested conditionals.
- Write comments to explain why, not what. Keep them short.