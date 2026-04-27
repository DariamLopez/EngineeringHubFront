# Project Management Frontend — Vue 3 + Vuetify 3

A full-featured **project management SPA** built with Vue 3, Vuetify 3, Pinia, and TypeScript. The application allows organisations to manage projects, modules, artifacts, users, and audit events through a role-based interface backed by a REST API.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Setup & Installation](#setup--installation)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [Project Structure](#project-structure)
- [Role-Based Access Control](#role-based-access-control)
- [Deployment](#deployment)
- [Potential Improvements](#potential-improvements)

---

## Overview

This frontend application serves as the client interface for a project management system. It connects to a Laravel REST API backend and provides role-aware views so that admins can manage every resource, while regular users operate within their granted abilities.

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Vue 3 (Composition API) | 3.5.7 |
| UI Library | Vuetify 3 | 3.7.1 |
| State Management | Pinia | 3.0.1 |
| Routing | Vue Router 4 | 4.0.12 |
| HTTP Client | Axios | 1.7.6 |
| Form Validation | Vee-Validate + Yup | 4.6.7 / 1.4.0 |
| Internationalisation | Vue I18n | 9.x |
| Language | TypeScript/JavaScript | 5.x |
| Build Tool | Vite | 5.x |
| Styles | SCSS + Vuetify theming | — |
| Linting | ESLint + Prettier | 8.x / 3.x |
| Deployment | Netlify | — |

---

## Architecture

```
src/
├── _mockApis/        # Axios mock adapter for local development / testing
├── assets/           # Static images and SVGs
├── components/       # Reusable UI components (shared, forms, tree views, auth)
├── enum/             # Application enumerations
├── layouts/          # Full (authenticated) and Blank (public) layouts
├── plugins/          # Vuetify plugin setup
├── router/           # Vue Router — auth guards, route definitions
├── scss/             # Global SCSS overrides and variables
├── stores/           # Pinia stores (auth, selectedItems, auditEvents, customizer)
├── theme/            # Light/Dark Vuetify theme definitions
├── types/            # TypeScript type definitions
├── utils/            # Axios instance, date helpers, RBAC helper
└── views/            # Page-level components
```

The application uses a **two-layout pattern**:
- `BlankLayout` — unauthenticated pages (Login, Register, 404).
- `FullLayout` — authenticated pages with sidebar navigation.

---

## Features

- **Authentication** — JWT-based login with token stored in `localStorage`; automatic redirect on 401.
- **Projects** — list, search, create, edit, and delete projects with inline dialogs.
- **Modules** — manage modules linked to a project; hierarchical tree view navigation.
- **Artifacts** — create and view typed artifacts (e.g., Strategic Alignment) per project/module.
- **Users** — admin-only user management table.
- **Audit Events** — paginated audit log viewer with JSON detail dialogs.
- **Role-Based Access Control** — `admin` role has full access; regular users are limited by ability flags returned by the API.
- **Theming** — supports multiple colour themes (Orange, Blue, etc.) with Light/Dark mode toggle.
- **Responsive UI** — built on Vuetify's grid system for desktop and mobile viewports.

---

## Prerequisites

Make sure the following are installed before setting up the project:

| Tool | Minimum Version |
|---|---|
| Node.js | 18.x LTS |
| npm | 9.x |
| Git | Any recent version |

> A running instance of the backend API (Laravel) is required for full functionality. The default expected URL is `http://localhost:8000/api`.

---

## Setup & Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd test-fronted-vue
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy the example file and adjust the values:

```bash
cp .env.example .env
```

Edit `.env` with your editor and set the API URL (see [Environment Variables](#environment-variables)).

### 4. Start the development server

```bash
npm run dev
```

The application will be available at `http://localhost:5173` by default.

---

## Environment Variables

| Variable | Description | Example |
|---|---|---|
| `VITE_API_URL` | Base URL of the backend REST API | `http://localhost:8000/api` |

> All Vite environment variables must be prefixed with `VITE_` to be exposed to the client bundle.

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the Vite development server with HMR |
| `npm run build` | Type-check and build for production (`dist/`) |
| `npm run preview` | Preview the production build locally on port 5050 |
| `npm run typecheck` | Run `vue-tsc` type checking without emitting files |
| `npm run lint` | Lint and auto-fix all `.vue`, `.ts`, and `.js` files |

---

## Project Structure

### Key Views

| Route | View | Access |
|---|---|---|
| `/` | `TableProject.vue` | All authenticated users |
| `/FormProject` | `FormProject.vue` | `admin` or `edit_projects` |
| `/DetailsProject/:projectName/:name` | `DetailsProject.vue` | All authenticated users |
| `/TableUsers` | `TableUsers.vue` | `admin` or `edit_users` |
| `/FormUser` | `FormUser.vue` | `admin` or `edit_users` |
| `/TableArtifact` | `TableArtifact.vue` | All authenticated users |
| `/DetailsProject/FormArtifact` | `FormArtifact.vue` | `admin` or `edit_artifact` |
| `/FormModule` | `FormModule.vue` | `admin` or `edit_modules` |
| `/TableModule` | `TableModule.vue` | All authenticated users |
| `/DetailsModule/:id` | `DetailsModule.vue` | All authenticated users (requires module in store) |
| `/Audit` | `Audit.vue` | All authenticated users |
| `/auth/login` | `SideLogin.vue` | Public |
| `/auth/register` | `SideRegister.vue` | Public |

### Key Stores (Pinia)

| Store | Purpose |
|---|---|
| `auth` | Manages JWT login/logout and persists user to `localStorage` |
| `selectedItems` | Holds the currently selected project, module, and artifact; persisted to `sessionStorage` |
| `auditEvents` | In-memory store for client-side audit event tracking |
| `customizer` | UI preferences (theme, sidebar state, layout direction) |

---

## Role-Based Access Control

Permissions are evaluated by the `hasAccess(ability)` helper (`src/utils/helpers/hasAccess.ts`):

1. The API returns the authenticated user object including a `roles` array and an `abilities` array.
2. Users with the `admin` role bypass all ability checks.
3. All other users must have the specific ability string (e.g., `edit_projects`) in their `abilities` array.
4. Vue Router `beforeEnter` guards call `hasAccess` before entering protected routes and redirect to `/` on failure.

---

## Deployment

The project is pre-configured for **Netlify** deployment via `netlify.toml`:

```toml
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

The SPA redirect rule ensures Vue Router's history mode works correctly on Netlify without returning 404 on page refresh.

### Manual deployment steps

```bash
npm run build
# Upload the contents of dist/ to your static hosting provider
```

---

## Potential Improvements

### Architecture & Code Quality

- **End-to-end and unit testing** — The project currently has no test suite. Adding Vitest for unit tests and Playwright (or Cypress) for E2E tests would significantly increase confidence during refactoring and delivery.
- **Centralise API layer** — HTTP calls are scattered across individual view components. Extracting them into dedicated composables or service modules (e.g., `useProjectService()`) would improve testability and reduce duplication.
- **TypeScript strictness** — Most view and component files use `<script setup>` without `lang="ts"`, making them implicitly JavaScript. There is also at least one `@ts-ignore` suppression in the auth store. Adding `lang="ts"` and proper type annotations across all components would surface type errors at build time.
- **Error handling** — Most API calls catch errors and `console.error` silently. A global error-notification system (toast/snackbar) would surface failures to users rather than failing invisibly.

### Security

- **Token storage** — JWT is stored in `localStorage`, which is vulnerable to XSS. Migrating to `httpOnly` cookies (managed by the backend) is the recommended approach for higher-security contexts.
- **Permission checks server-side** — RBAC is enforced only on the frontend. The API must independently validate permissions on every request; the frontend guards are UX conveniences only.

### Performance

- **Route-level code splitting** — Already in place via dynamic `import()` on all routes. Auditing the bundle with `vite-bundle-visualizer` would confirm whether dependencies registered globally in `main.ts` (e.g., VueApexCharts, VueScrollTo) add unnecessary weight to the initial load.
- **API pagination** — `TableProject` and `TableUsers` fetch all records in a single request with no pagination. `Audit.vue` already implements server-side pagination correctly. Applying the same pattern to the remaining tables would improve performance at scale.
- **Caching** — Frequently-read reference data (roles, statuses) could be cached in a Pinia store with a TTL to reduce redundant API calls.

### Developer Experience

- **Storybook** — Documenting shared components (`UiParentCard`, `AppBaseCard`, etc.) in Storybook would accelerate onboarding and allow visual regression testing.
- **API mocking in development** — The `_mockApis/` directory sets up an Axios mock adapter but immediately calls `mock.onAny().passThrough()`, meaning it does not intercept any requests. `TableArtifact` and `TableModule` currently work with static data arrays imported directly from `_mockApis/dataTable.ts` rather than real API calls. Replacing this approach with MSW (Mock Service Worker) would provide a consistent, maintainable offline development experience across all views.
- **Environment-specific configuration** — Add `.env.staging` and `.env.production` files to separate deployment targets clearly.
- **Husky + lint-staged** — Add pre-commit hooks to enforce linting and type-checking before every commit.

### UX & Features

- **Internationalisation completeness** — Vue I18n is installed and configured in `main.ts` with locale files for English, French, Arabic, and Chinese. However, `$t()` is not used in any view or component template. Applying translation keys throughout the UI would activate full multi-language support with the infrastructure already in place.
- **Optimistic UI updates** — Forms currently wait for API round-trips before updating the table. Optimistic updates would make the interface feel significantly faster.
- **Accessibility (a11y)** — Audit and improve ARIA labels, keyboard navigation, and colour contrast ratios to meet WCAG 2.1 AA standards.
- **Dark mode persistence** — Persist the user's theme preference to `localStorage` so it survives page refreshes and sessions.
