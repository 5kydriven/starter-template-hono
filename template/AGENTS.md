# AGENTS.md

## 1. Overview

This repository is a Cloudflare Worker API starter organized around typed Hono request handling, auth/session context, and Drizzle-backed persistence. Keep new code aligned with the existing route, middleware, schema, and database boundaries.

## 2. Folder Structure

- `src/index.ts`: application entry point; registers global error handling, CORS, database/auth middleware, root health text, and mounted feature routes.
- `src/modules`: domain-facing HTTP modules.
  - `auth`: the implemented feature module; keeps OpenAPI route contracts, handlers, and Zod schemas in separate sibling files.
- `src/middleware`: reusable request pipeline steps that read/write Hono context variables or enforce access.
- `src/lib`: shared factories and application primitives such as Better Auth setup and typed application errors.
- `src/db`: database client creation, schema exports, and generated migrations.
  - `schema`: Drizzle table definitions and schema barrel exports.
  - `migrations`: generated Drizzle migration SQL and metadata; treat as generated artifacts.
- `src/types`: shared environment, context-variable, role, pagination, and auth user types.
- `src/constants`: reusable enum-like maps and helpers for roles and error codes.
- Root config files (`package.json`, `tsconfig.json`, `wrangler.jsonc`, `drizzle.config.ts`): runtime, TypeScript, Worker, and migration configuration.
- `worker-configuration.d.ts`: generated Cloudflare bindings/runtime types; avoid hand-editing.
- `hono-api-architecture.md`: architectural reference. Follow it only where it matches current source, and do not assume unimplemented folders exist.

## 3. Core Behaviors & Patterns

- **Request pipeline**: `src/index.ts` creates `new Hono<AppEnv>()`, installs `app.onError(errorHandler)`, then applies global middleware in order: CORS, `dbMiddleware()`, and `withAuth`. New global request concerns should be registered here only when they truly apply to every route.
- **Context hydration**: middleware uses Hono variables as the shared request state. `dbMiddleware()` stores `db`; `withAuth` reads `db`, creates `auth`, fetches the current session, then stores `auth`, `user`, and `session`. Handlers should read these with `c.get(...)` instead of rebuilding the same state.
- **Database lifecycle**: `createDbConnection(databaseUrl)` branches by hostname. Local `localhost`/`127.0.0.1` databases use a dynamic `pg` client and return a `dispose` callback; non-local URLs reuse a cached Neon HTTP Drizzle client by database URL. Middleware owns cleanup in `finally`, so callers should not close DB resources directly.
- **Auth boundary**: `createAuth(db, env)` centralizes Better Auth configuration, Drizzle adapter schema mapping, email/password auth, default role metadata, and trusted origins. Route handlers call `auth.api.*` through the context-provided `auth`.
- **Auth header propagation**: Better Auth APIs are called with `returnHeaders: true`. Both `withAuth` and auth handlers copy returned headers to the Hono response, appending `Set-Cookie` specially and forwarding other headers normally. Preserve this behavior when adding auth flows.
- **Route contract flow**: feature routes use `OpenAPIHono<AppEnv>()`, define each operation with `createRoute(...)`, and wire it with `authRoute.openapi(routeDefinition, handler)`. Handlers are typed as `RouteHandler<typeof routeDefinition, AppEnv>` and read validated inputs with `c.req.valid('json')`, `c.req.valid('param')`, or `c.req.valid('query')`.
- **Protected route flow**: authentication is globally hydrated by `withAuth`, but route-level protection is explicit. `authRoute.use('/logout', requireAuth)` and `authRoute.use('/me', requireAuth)` are mounted immediately before their protected OpenAPI handlers.
- **Error boundary**: thrown errors are flattened by `errorHandler` into `{ error: { code, message, details } }`. It handles `AppError`, Hono `HTTPException`, Better Auth `APIError`, and `ZodError`; unknown errors are logged and returned as generic internal errors.
- **Role enforcement**: roles are ordered from `viewer` to `admin`. `requireRole(minimumRole)` checks `c.get('user')`, throws 401 when absent, and compares rank for 403 decisions. If roles change, update all role definitions and rank maps together.
- **Schema-to-response shape**: auth schemas are Zod objects with OpenAPI examples and are referenced from route response definitions. Current auth handlers return direct envelopes such as `{ user }`, `{ user, session }`, or Better Auth's logout response, so new auth responses should match their declared schemas exactly.
- **Drizzle schema exports**: table files define constants with `pgTable(...)` and export inferred select/insert types. `src/db/schema/index.ts` re-exports schema files so client creation can import `* as schema`.

## 4. Conventions

- **Module files**: feature modules use a domain folder with `domain.route.ts`, `domain.handler.ts`, and `domain.schema.ts`. The implemented example is `src/modules/auth/auth.route.ts`, `auth.handler.ts`, and `auth.schema.ts`.
- **Route names**: individual route definitions use lower camel case plus `Route` (`registerRoute`, `loginRoute`, `meRoute`). The mounted router uses the domain name plus `Route` (`authRoute`).
- **Handler names**: handlers are action verbs or short endpoint names (`register`, `login`, `logout`, `me`) and are exported from the domain handler file.
- **Schema names**: Zod schemas use PascalCase plus `Schema` (`RegisterSchema`, `AuthUserSchema`, `MeResponseSchema`). Request and response schemas live beside the route/handler they serve.
- **Middleware names**: middleware files are kebab-case (`with-auth.ts`, `require-auth.ts`, `error-handler.ts`). Exported middleware is lower camel case and usually reads like a pipeline step or guard (`withAuth`, `requireAuth`, `requireRole`, `dbMiddleware`).
- **Factory names**: shared constructors use `create*` names (`createAuth`, `createDbConnection`). Keep factory responsibilities narrow and return typed values rather than mutating globals, except for intentional caches like `neonDbCache`.
- **Types**: exported types and interfaces use PascalCase (`AppEnv`, `AppBindings`, `AppVariables`, `UserRole`, `AuthUser`). Inferred Drizzle types follow entity names (`User`, `NewUser`, `AuthSession`).
- **Constants**: enum-like objects and maps use uppercase names when they represent shared constants (`ErrorCode`, `ROLE_HIERARCHY`). Error code values are `UPPER_SNAKE_CASE` strings.
- **Database naming**: TypeScript table objects use lower camel case or plural entity names (`user`, `session`, `users`). Database columns are snake_case in Drizzle definitions (`email_verified`, `created_at`), while TypeScript properties stay camelCase (`emailVerified`, `createdAt`); Drizzle clients are configured with `casing: 'snake_case'`.
- **Imports**: external packages come first, then internal app imports, then relative same-module imports. Use `import type` for type-only dependencies. Prefer the `@/` alias for cross-directory source imports and relative imports for sibling files.
- **Function style**: exported functions are usually `const` arrow functions with explicit framework types when they cross Hono boundaries. Guard clauses and early returns are preferred for invalid or absent state.
- **Response construction**: handlers return `c.json(payload, status)` with explicit status codes. Root text responses use `c.text(...)`. Do not introduce a new response envelope without updating the matching route schemas.
- **Error construction**: use `HTTPException` for Hono boundary guard failures already following that pattern. Use `Errors.*`/`AppError` for application-domain errors that should carry stable application error codes and details.
- **Context variables**: if a middleware sets a new `c.set(...)` variable, add its type to `AppVariables` in `src/types/app.ts` before consuming it elsewhere.
- **Environment bindings**: application code reads runtime values from `c.env` or `CloudflareBindings`-typed env parameters. Binding names are uppercase snake case and must stay synchronized with generated Worker types when the Worker config changes.
- **Comments**: source comments are rare and short. Preserve generated-file headers, and add comments only when they explain non-obvious boundary behavior or generated artifacts.

## 5. Working Agreements

- Respond in the user's preferred language; if unspecified, use English and keep technical terms in English.
- Do not modify or translate fenced code blocks in user-provided content.
- Ask before introducing new tests, lint rules, formatter setup, or broad architecture changes.
- Before editing, review related usages, route wiring, context variables, schemas, and generated/config boundaries that the change may affect.
- Solve the user's request with the smallest focused change that fits the current codebase; report meaningful side effects or mismatches found during analysis.
- Preserve public API behavior unless the user asks to change it, especially route response shapes and auth/session behavior.
- Run type-check after code changes with `bun run typecheck` (`tsc --noEmit`) when dependencies are available.
- New functions/modules should be single-purpose and colocated with the nearest existing route, middleware, lib, db, or type concern.
- Avoid new external dependencies unless necessary, and explain why if one is added.
