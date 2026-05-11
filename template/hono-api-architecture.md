# Hono REST API Architecture
### Scalable, Readable, Maintainable — Medium to Large Apps

---

## Table of Contents

1. [Architecture Decisions](#architecture-decisions)
2. [Tech Stack](#tech-stack)
3. [Folder Structure](#folder-structure)
4. [Response Shapes](#response-shapes)
5. [Configuration & Types](#configuration--types)
6. [Database Layer](#database-layer)
7. [Repositories](#repositories)
8. [Services](#services)
9. [Modules (Route + Handler + Schema)](#modules)
10. [Middleware](#middleware)
11. [WebSocket](#websocket)
12. [Cron Jobs](#cron-jobs)
13. [OpenAPI & Docs](#openapi--docs)
14. [Project Config Files](#project-config-files)

---

## Architecture Decisions

### Layer responsibilities (strict — do not mix)

| Layer | File suffix | Allowed to | Not allowed to |
|---|---|---|---|
| Route | `*.route.ts` | Define OpenAPI contract, mount middleware, wire handlers | Contain logic, call DB |
| Handler | `*.handler.ts` | Parse validated input, call service, format response | Call DB directly, contain business logic |
| Service | `*.service.ts` | Business logic, orchestration, throw `AppError` | Import `Context`, use HTTP types |
| Repository | `*.repo.ts` | Run Drizzle queries | Contain any logic, throw errors |
| Schema | `*.schema.ts` | Define Zod schemas reused by route + OpenAPI | Import other layers |

### Key principles

- **One module per domain** — each domain owns its route, handler, and schema. Nothing leaks across.
- **Services are pure** — no `Context`, no `c.json()`. Fully unit-testable without HTTP.
- **Repositories are thin** — raw Drizzle queries only. All decisions happen in the service layer.
- **Errors bubble up via `AppError`** — a single global error handler formats every failure the same way.
- **OpenAPI is the source of truth** — schemas defined once in Zod, validated at runtime, and auto-published as docs.
- **Consistent response envelope** — every endpoint returns `{ data, meta }` on success and `{ error }` on failure.

---

## Tech Stack

| Tool | Purpose | Why |
|---|---|---|
| [Hono](https://hono.dev) | Framework | Edge-native, ultra-fast, first-class TypeScript |
| [@hono/zod-openapi](https://github.com/honojs/middleware/tree/main/packages/zod-openapi) | Validation + OpenAPI | Single Zod schema drives both runtime validation and spec generation |
| [@scalar/hono-api-reference](https://github.com/scalar/scalar) | Docs UI | Beautiful, modern alternative to Swagger UI |
| [Drizzle ORM](https://orm.drizzle.team) | Database ORM | SQL-first, fully typed, edge-runtime compatible |
| [Neon](https://neon.tech) (Postgres) | Database | Serverless Postgres, generous free tier, HTTP driver for edge |
| [Zod](https://zod.dev) | Schema validation | Runtime safety + static types in one |
| [Cloudflare Workers](https://workers.cloudflare.com) | Deployment | Best Hono runtime, global edge, free tier |
| `hono/jwt` | Auth tokens | Built-in JWT, no extra deps |

All free. All edge-compatible.

---

## Folder Structure

```
my-api/
├── wrangler.toml                   ← Cloudflare Workers config + cron triggers
├── package.json
├── tsconfig.json
├── drizzle.config.ts               ← Drizzle Kit migration config
│
└── src/
    ├── index.ts                    ← App entry: middleware, routes, scheduled export
    ├── config.ts                   ← Env vars validated with Zod
    │
    ├── constants/
    │   ├── error-codes.ts          ← Enum of all error code strings
    │   └── roles.ts                ← Role hierarchy map
    │
    ├── types/
    │   ├── env.d.ts                ← Cloudflare Env bindings type
    │   └── common.ts               ← Shared TS types (PaginatedResult, etc.)
    │
    ├── lib/
    │   ├── errors.ts               ← AppError class + typed constructors
    │   ├── response.ts             ← ok / created / paginated / cursorPaginated helpers
    │   └── pagination.ts           ← Cursor encode/decode, offset math
    │
    ├── middleware/
    │   ├── auth.ts                 ← JWT guard — sets c.get('user')
    │   ├── cors.ts                 ← CORS config
    │   ├── rate-limit.ts           ← Simple rate limiter (KV-backed)
    │   ├── require-role.ts         ← Role-based access guard
    │   ├── request-id.ts           ← Attaches X-Request-Id to every request
    │   ├── error-handler.ts        ← Global onError formatter
    │   └── logger.ts               ← Request logging
    │
    ├── db/
    │   ├── index.ts                ← Drizzle client factory
    │   ├── schema/
    │   │   ├── users.ts
    │   │   ├── posts.ts
    │   │   ├── sessions.ts
    │   │   └── index.ts            ← Re-exports all tables
    │   └── migrations/             ← drizzle-kit generated SQL files
    │
    ├── modules/
    │   ├── health/
    │   │   └── health.route.ts     ← GET /health
    │   ├── auth/
    │   │   ├── auth.route.ts
    │   │   ├── auth.handler.ts
    │   │   └── auth.schema.ts
    │   ├── users/
    │   │   ├── users.route.ts
    │   │   ├── users.handler.ts
    │   │   └── users.schema.ts
    │   ├── posts/
    │   │   ├── posts.route.ts
    │   │   ├── posts.handler.ts
    │   │   └── posts.schema.ts
    │   └── ws/
    │       └── ws.route.ts         ← WebSocket upgrade handler
    │
    ├── services/
    │   ├── auth.service.ts
    │   ├── users.service.ts
    │   └── posts.service.ts
    │
    ├── repositories/
    │   ├── users.repo.ts
    │   ├── posts.repo.ts
    │   └── sessions.repo.ts
    |
    └── cron/
        ├── index.ts                ← Scheduled event dispatcher
        └── jobs/
            ├── cleanup-sessions.ts
            └── send-digest.ts
```

---

## Response Shapes

Every endpoint returns one of these envelopes. Never deviate from this contract.

### Success — single resource

```json
{
  "data": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "name": "Maria Santos",
    "email": "maria@example.com",
    "role": "admin",
    "createdAt": "2026-05-04T08:30:00.000Z",
    "updatedAt": "2026-05-04T08:30:00.000Z"
  },
  "meta": null
}
```

### Success — list without pagination

```json
{
  "data": [
    {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "name": "Maria Santos",
      "email": "maria@example.com",
      "role": "admin",
      "createdAt": "2026-05-04T08:30:00.000Z"
    },
    {
      "id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
      "name": "Juan dela Cruz",
      "email": "juan@example.com",
      "role": "member",
      "createdAt": "2026-05-03T12:00:00.000Z"
    }
  ],
  "meta": null
}
```

### Success — offset pagination

Query: `GET /api/v1/posts?page=2&perPage=20&sort=createdAt&order=desc&status=published`

```json
{
  "data": [
    {
      "id": "a1b2c3d4-...",
      "title": "Getting started with Hono",
      "status": "published",
      "authorId": "user-uuid",
      "createdAt": "2026-05-04T08:30:00.000Z"
    }
  ],
  "meta": {
    "pagination": {
      "total": 84,
      "page": 2,
      "perPage": 20,
      "totalPages": 5,
      "hasNext": true,
      "hasPrev": true
    },
    "filter": {
      "status": "published"
    },
    "sort": {
      "field": "createdAt",
      "order": "desc"
    }
  }
}
```

### Success — cursor pagination

Query: `GET /api/v1/posts?cursor=eyJpZCI6ImExYjIifQ==&perPage=20`

```json
{
  "data": [
    {
      "id": "a1b2c3d4-...",
      "title": "Getting started with Hono",
      "status": "published",
      "createdAt": "2026-05-04T08:30:00.000Z"
    }
  ],
  "meta": {
    "pagination": {
      "nextCursor": "eyJpZCI6ImIyYzMiLCJjcmVhdGVkQXQiOiIyMDI2LTA1LTAzIn0=",
      "prevCursor": "eyJpZCI6ImExYjIiLCJjcmVhdGVkQXQiOiIyMDI2LTA1LTA0In0=",
      "hasNext": true,
      "hasPrev": true,
      "perPage": 20
    }
  }
}
```

### Error — validation failure (422)

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [
      { "field": "email", "message": "Invalid email address" },
      { "field": "role", "message": "Expected 'admin' | 'editor' | 'member' | 'viewer'" }
    ]
  }
}
```

### Error — not found (404)

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "User not found",
    "details": []
  }
}
```

### Error — unauthorized (401)

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Missing or invalid token",
    "details": []
  }
}
```

### Error — forbidden (403)

```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "Insufficient role. Required: editor",
    "details": []
  }
}
```

### Error — conflict (409)

```json
{
  "error": {
    "code": "CONFLICT",
    "message": "Email already in use",
    "details": []
  }
}
```

### Error — internal server error (500)

```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred",
    "details": []
  }
}
```

---

## Configuration & Types

### `src/config.ts`

```ts
import { z } from 'zod'

const EnvSchema = z.object({
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('7d'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CORS_ORIGIN: z.string().default('*'),
})

export type Config = z.infer<typeof EnvSchema>

export const getConfig = (env: Record<string, string | undefined>): Config => {
  const result = EnvSchema.safeParse(env)
  if (!result.success) {
    const missing = result.error.issues.map(i => i.path.join('.')).join(', ')
    throw new Error(`Missing or invalid environment variables: ${missing}`)
  }
  return result.data
}
```

### `src/types/env.d.ts`

```ts
export interface Env {
  DATABASE_URL: string
  JWT_SECRET: string
  JWT_EXPIRES_IN: string
  NODE_ENV: string
  CORS_ORIGIN: string
  // Cloudflare KV namespace (for rate limiting, sessions)
  KV: KVNamespace
}
```

### `src/types/common.ts`

```ts
export type UserRole = 'admin' | 'editor' | 'member' | 'viewer'

export interface AuthUser {
  id: string
  email: string
  role: UserRole
}

export interface OffsetPaginationMeta {
  total: number
  page: number
  perPage: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export interface CursorPaginationMeta {
  nextCursor: string | null
  prevCursor: string | null
  hasNext: boolean
  hasPrev: boolean
  perPage: number
}

export type SortOrder = 'asc' | 'desc'
```

### `src/constants/error-codes.ts`

```ts
export const ErrorCode = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  CONFLICT: 'CONFLICT',
  UNPROCESSABLE: 'UNPROCESSABLE',
  RATE_LIMITED: 'RATE_LIMITED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode]
```

### `src/constants/roles.ts`

```ts
import type { UserRole } from '../types/common'

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  viewer: 1,
  member: 2,
  editor: 3,
  admin: 4,
}

export const hasRole = (userRole: UserRole, requiredRole: UserRole): boolean =>
  ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole]
```

---

## Database Layer

### `src/db/schema/users.ts`

```ts
import { pgTable, uuid, text, timestamp, pgEnum } from 'drizzle-orm/pg-core'

export const userRoleEnum = pgEnum('user_role', ['admin', 'editor', 'member', 'viewer'])

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  role: userRoleEnum('role').default('member').notNull(),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
```

### `src/db/schema/posts.ts`

```ts
import { pgTable, uuid, text, timestamp, pgEnum } from 'drizzle-orm/pg-core'
import { users } from './users'

export const postStatusEnum = pgEnum('post_status', ['draft', 'published', 'archived'])

export const posts = pgTable('posts', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  status: postStatusEnum('status').default('draft').notNull(),
  authorId: uuid('author_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export type Post = typeof posts.$inferSelect
export type NewPost = typeof posts.$inferInsert
```

### `src/db/schema/sessions.ts`

```ts
import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core'
import { users } from './users'

export const sessions = pgTable('sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export type Session = typeof sessions.$inferSelect
```

### `src/db/schema/index.ts`

```ts
export * from './users'
export * from './posts'
export * from './sessions'
```

### `src/db/index.ts`

```ts
import { drizzle } from 'drizzle-orm/neon-http'
import { neon } from '@neondatabase/serverless'
import * as schema from './schema'

export const createDb = (databaseUrl: string) => {
  const sql = neon(databaseUrl)
  return drizzle(sql, { schema })
}

export type Db = ReturnType<typeof createDb>
```

---

## Repositories

### `src/db/repositories/users.repo.ts`

```ts
import { eq, ilike, count, asc, desc, and, gt, lt, or } from 'drizzle-orm'
import type { Db } from '../index'
import { users, type NewUser } from '../schema'
import type { SortOrder } from '../../types/common'

export const createUsersRepo = (db: Db) => ({
  findById: (id: string) =>
    db.select().from(users).where(eq(users.id, id)).limit(1).then(r => r[0] ?? null),

  findByEmail: (email: string) =>
    db.select().from(users).where(eq(users.email, email)).limit(1).then(r => r[0] ?? null),

  create: (data: NewUser) =>
    db.insert(users).values(data).returning().then(r => r[0]),

  update: (id: string, data: Partial<NewUser>) =>
    db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning()
      .then(r => r[0] ?? null),

  delete: (id: string) =>
    db.delete(users).where(eq(users.id, id)).returning().then(r => r[0] ?? null),

  // Offset pagination with search + sort
  findManyOffset: async (opts: {
    page: number
    perPage: number
    search?: string
    role?: string
    sortField?: 'name' | 'createdAt'
    sortOrder?: SortOrder
  }) => {
    const { page, perPage, search, role, sortField = 'createdAt', sortOrder = 'desc' } = opts
    const offset = (page - 1) * perPage

    const conditions = []
    if (search) conditions.push(or(ilike(users.name, `%${search}%`), ilike(users.email, `%${search}%`)))
    if (role) conditions.push(eq(users.role, role as any))

    const where = conditions.length > 0 ? and(...conditions) : undefined
    const orderBy = sortOrder === 'asc'
      ? asc(users[sortField])
      : desc(users[sortField])

    const [rows, [{ value: total }]] = await Promise.all([
      db.select().from(users).where(where).orderBy(orderBy).limit(perPage).offset(offset),
      db.select({ value: count() }).from(users).where(where),
    ])

    return { rows, total: Number(total) }
  },

  // Cursor pagination
  findManyCursor: async (opts: {
    cursor: string | null
    perPage: number
    direction: 'next' | 'prev'
  }) => {
    const { cursor, perPage, direction } = opts

    let query = db.select().from(users).limit(perPage + 1).orderBy(asc(users.createdAt))

    if (cursor) {
      const { id } = JSON.parse(Buffer.from(cursor, 'base64url').toString())
      query = direction === 'next'
        ? query.where(gt(users.id, id))
        : query.where(lt(users.id, id))
    }

    const rows = await query
    const hasMore = rows.length > perPage
    if (hasMore) rows.pop()

    const nextCursor = hasMore
      ? Buffer.from(JSON.stringify({ id: rows.at(-1)!.id })).toString('base64url')
      : null
    const prevCursor = cursor
      ? Buffer.from(JSON.stringify({ id: rows[0].id })).toString('base64url')
      : null

    return { rows, nextCursor, prevCursor }
  },
})

export type UsersRepo = ReturnType<typeof createUsersRepo>
```

### `src/db/repositories/posts.repo.ts`

```ts
import { eq, ilike, count, asc, desc, and, gt, lt } from 'drizzle-orm'
import type { Db } from '../index'
import { posts, type NewPost } from '../schema'
import type { SortOrder } from '../../types/common'

export const createPostsRepo = (db: Db) => ({
  findById: (id: string) =>
    db.select().from(posts).where(eq(posts.id, id)).limit(1).then(r => r[0] ?? null),

  create: (data: NewPost) =>
    db.insert(posts).values(data).returning().then(r => r[0]),

  update: (id: string, data: Partial<NewPost>) =>
    db
      .update(posts)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(posts.id, id))
      .returning()
      .then(r => r[0] ?? null),

  delete: (id: string) =>
    db.delete(posts).where(eq(posts.id, id)).returning().then(r => r[0] ?? null),

  findManyOffset: async (opts: {
    page: number
    perPage: number
    search?: string
    status?: string
    authorId?: string
    sortField?: 'title' | 'createdAt' | 'updatedAt'
    sortOrder?: SortOrder
  }) => {
    const {
      page, perPage, search, status, authorId,
      sortField = 'createdAt', sortOrder = 'desc',
    } = opts
    const offset = (page - 1) * perPage

    const conditions = []
    if (search) conditions.push(ilike(posts.title, `%${search}%`))
    if (status) conditions.push(eq(posts.status, status as any))
    if (authorId) conditions.push(eq(posts.authorId, authorId))

    const where = conditions.length > 0 ? and(...conditions) : undefined
    const orderBy = sortOrder === 'asc' ? asc(posts[sortField]) : desc(posts[sortField])

    const [rows, [{ value: total }]] = await Promise.all([
      db.select().from(posts).where(where).orderBy(orderBy).limit(perPage).offset(offset),
      db.select({ value: count() }).from(posts).where(where),
    ])

    return { rows, total: Number(total) }
  },
})

export type PostsRepo = ReturnType<typeof createPostsRepo>
```

### `src/db/repositories/sessions.repo.ts`

```ts
import { eq, lt } from 'drizzle-orm'
import type { Db } from '../index'
import { sessions } from '../schema'

export const createSessionsRepo = (db: Db) => ({
  create: (data: { userId: string; token: string; expiresAt: Date }) =>
    db.insert(sessions).values(data).returning().then(r => r[0]),

  findByToken: (token: string) =>
    db.select().from(sessions).where(eq(sessions.token, token)).limit(1).then(r => r[0] ?? null),

  deleteByToken: (token: string) =>
    db.delete(sessions).where(eq(sessions.token, token)).returning().then(r => r[0] ?? null),

  deleteExpired: async () => {
    const deleted = await db
      .delete(sessions)
      .where(lt(sessions.expiresAt, new Date()))
      .returning({ id: sessions.id })
    return deleted.length
  },
})
```

---

## Services

### `src/lib/errors.ts`

```ts
import type { ErrorCode } from '../constants/error-codes'

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: ErrorCode,
    message: string,
    public details: { field?: string; message: string }[] = []
  ) {
    super(message)
    this.name = 'AppError'
  }
}

// Typed constructors — use these instead of new AppError() directly
export const Errors = {
  notFound: (message = 'Resource not found') =>
    new AppError(404, 'NOT_FOUND', message),

  unauthorized: (message = 'Missing or invalid token') =>
    new AppError(401, 'UNAUTHORIZED', message),

  forbidden: (required?: string) =>
    new AppError(403, 'FORBIDDEN', required ? `Insufficient role. Required: ${required}` : 'Forbidden'),

  conflict: (message: string) =>
    new AppError(409, 'CONFLICT', message),

  validation: (details: { field: string; message: string }[]) =>
    new AppError(422, 'VALIDATION_ERROR', 'Request validation failed', details),

  internal: (message = 'An unexpected error occurred') =>
    new AppError(500, 'INTERNAL_ERROR', message),
}
```

### `src/lib/response.ts`

```ts
import type { Context } from 'hono'
import type { OffsetPaginationMeta, CursorPaginationMeta, SortOrder } from '../types/common'

export const ok = (c: Context, data: unknown, meta: unknown = null) =>
  c.json({ data, meta }, 200)

export const created = (c: Context, data: unknown) =>
  c.json({ data, meta: null }, 201)

export const noContent = (c: Context) => c.body(null, 204)

export const paginated = (
  c: Context,
  data: unknown[],
  pagination: { total: number; page: number; perPage: number },
  extras?: { filter?: Record<string, unknown>; sort?: { field: string; order: SortOrder } }
) => {
  const totalPages = Math.ceil(pagination.total / pagination.perPage)
  const meta: { pagination: OffsetPaginationMeta; filter?: unknown; sort?: unknown } = {
    pagination: {
      total: pagination.total,
      page: pagination.page,
      perPage: pagination.perPage,
      totalPages,
      hasNext: pagination.page < totalPages,
      hasPrev: pagination.page > 1,
    },
  }
  if (extras?.filter) meta.filter = extras.filter
  if (extras?.sort) meta.sort = extras.sort
  return c.json({ data, meta }, 200)
}

export const cursorPaginated = (
  c: Context,
  data: unknown[],
  cursors: { nextCursor: string | null; prevCursor: string | null; perPage: number }
) =>
  c.json({
    data,
    meta: {
      pagination: {
        nextCursor: cursors.nextCursor,
        prevCursor: cursors.prevCursor,
        hasNext: !!cursors.nextCursor,
        hasPrev: !!cursors.prevCursor,
        perPage: cursors.perPage,
      } satisfies CursorPaginationMeta,
    },
  }, 200)
```

### `src/services/users.service.ts`

```ts
import { hash, compare } from 'bcryptjs'
import type { UsersRepo } from '../db/repositories/users.repo'
import { Errors } from '../lib/errors'
import type { UserRole } from '../types/common'

// Services receive their repos as constructor arguments — easy to mock in tests
export const createUsersService = (usersRepo: UsersRepo) => ({
  async getById(id: string) {
    const user = await usersRepo.findById(id)
    if (!user) throw Errors.notFound('User not found')
    return user
  },

  async create(data: { name: string; email: string; password: string; role?: UserRole }) {
    const existing = await usersRepo.findByEmail(data.email)
    if (existing) throw Errors.conflict('Email already in use')

    const passwordHash = await hash(data.password, 12)
    return usersRepo.create({
      name: data.name,
      email: data.email,
      passwordHash,
      role: data.role ?? 'member',
    })
  },

  async update(id: string, data: Partial<{ name: string; role: UserRole }>) {
    const user = await usersRepo.findById(id)
    if (!user) throw Errors.notFound('User not found')
    return usersRepo.update(id, data)
  },

  async delete(id: string) {
    const user = await usersRepo.findById(id)
    if (!user) throw Errors.notFound('User not found')
    await usersRepo.delete(id)
  },

  async listOffset(opts: {
    page: number
    perPage: number
    search?: string
    role?: string
    sortField?: 'name' | 'createdAt'
    sortOrder?: 'asc' | 'desc'
  }) {
    return usersRepo.findManyOffset(opts)
  },

  async listCursor(opts: { cursor: string | null; perPage: number; direction: 'next' | 'prev' }) {
    return usersRepo.findManyCursor(opts)
  },
})

export type UsersService = ReturnType<typeof createUsersService>
```

### `src/services/auth.service.ts`

```ts
import { compare } from 'bcryptjs'
import { sign } from 'hono/jwt'
import type { UsersRepo } from '../db/repositories/users.repo'
import type { SessionsRepo } from '../db/repositories/sessions.repo'
import { Errors } from '../lib/errors'

type SessionsRepo = ReturnType<typeof import('../db/repositories/sessions.repo').createSessionsRepo>

export const createAuthService = (
  usersRepo: UsersRepo,
  sessionsRepo: SessionsRepo,
  jwtSecret: string
) => ({
  async login(email: string, password: string) {
    const user = await usersRepo.findByEmail(email)
    if (!user) throw Errors.unauthorized('Invalid email or password')

    const valid = await compare(password, user.passwordHash)
    if (!valid) throw Errors.unauthorized('Invalid email or password')

    const payload = { sub: user.id, email: user.email, role: user.role, iat: Date.now() }
    const token = await sign(payload, jwtSecret)

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    await sessionsRepo.create({ userId: user.id, token, expiresAt })

    // Never return passwordHash to the client
    const { passwordHash: _, ...safeUser } = user
    return { token, user: safeUser }
  },

  async logout(token: string) {
    await sessionsRepo.deleteByToken(token)
  },
})
```

### `src/services/posts.service.ts`

```ts
import type { PostsRepo } from '../db/repositories/posts.repo'
import { Errors } from '../lib/errors'

export const createPostsService = (postsRepo: PostsRepo) => ({
  async getById(id: string) {
    const post = await postsRepo.findById(id)
    if (!post) throw Errors.notFound('Post not found')
    return post
  },

  async create(data: { title: string; content: string; authorId: string }) {
    return postsRepo.create({ ...data, status: 'draft' })
  },

  async update(id: string, authorId: string, data: Partial<{ title: string; content: string; status: string }>) {
    const post = await postsRepo.findById(id)
    if (!post) throw Errors.notFound('Post not found')
    // Only the author can update their post
    if (post.authorId !== authorId) throw Errors.forbidden('editor')
    return postsRepo.update(id, data)
  },

  async publish(id: string, authorId: string) {
    return this.update(id, authorId, { status: 'published' })
  },

  async delete(id: string, authorId: string, requesterRole: string) {
    const post = await postsRepo.findById(id)
    if (!post) throw Errors.notFound('Post not found')
    // Admins can delete any post; others only their own
    if (post.authorId !== authorId && requesterRole !== 'admin') {
      throw Errors.forbidden()
    }
    await postsRepo.delete(id)
  },

  async listOffset(opts: {
    page: number
    perPage: number
    search?: string
    status?: string
    authorId?: string
    sortField?: 'title' | 'createdAt' | 'updatedAt'
    sortOrder?: 'asc' | 'desc'
  }) {
    return postsRepo.findManyOffset(opts)
  },
})
```

---

## Modules

### Auth module

#### `src/modules/auth/auth.schema.ts`

```ts
import { z } from '@hono/zod-openapi'

export const LoginSchema = z.object({
  email: z.string().email().openapi({ example: 'maria@example.com' }),
  password: z.string().min(8).openapi({ example: 'supersecret123' }),
})

export const AuthResponseSchema = z.object({
  token: z.string().openapi({ example: 'eyJhbGciOiJIUzI1NiJ9...' }),
  user: z.object({
    id: z.string().uuid(),
    name: z.string(),
    email: z.string().email(),
    role: z.enum(['admin', 'editor', 'member', 'viewer']),
  }),
})
```

#### `src/modules/auth/auth.route.ts`

```ts
import { OpenAPIHono, createRoute } from '@hono/zod-openapi'
import { LoginSchema, AuthResponseSchema } from './auth.schema'
import { login, logout } from './auth.handler'
import { authMiddleware } from '../../middleware/auth'

export const authRoute = new OpenAPIHono<{ Bindings: Env }>()

const loginRoute = createRoute({
  method: 'post',
  path: '/login',
  tags: ['Auth'],
  summary: 'Login with email and password',
  request: {
    body: { content: { 'application/json': { schema: LoginSchema } }, required: true },
  },
  responses: {
    200: {
      content: { 'application/json': { schema: AuthResponseSchema } },
      description: 'Login successful',
    },
    401: { description: 'Invalid credentials' },
  },
})

const logoutRoute = createRoute({
  method: 'post',
  path: '/logout',
  tags: ['Auth'],
  summary: 'Invalidate current session',
  security: [{ Bearer: [] }],
  responses: {
    204: { description: 'Logged out' },
    401: { description: 'Unauthorized' },
  },
})

authRoute.openapi(loginRoute, login)
authRoute.use('/logout', authMiddleware)
authRoute.openapi(logoutRoute, logout)
```

#### `src/modules/auth/auth.handler.ts`

```ts
import type { RouteHandler } from '@hono/zod-openapi'
import type { loginRoute, logoutRoute } from './auth.route'
import { createAuthService } from '../../services/auth.service'
import { createUsersRepo } from '../../db/repositories/users.repo'
import { createSessionsRepo } from '../../db/repositories/sessions.repo'
import { createDb } from '../../db'
import { noContent } from '../../lib/response'

export const login: RouteHandler<typeof loginRoute, { Bindings: Env }> = async (c) => {
  const { email, password } = c.req.valid('json')
  const db = createDb(c.env.DATABASE_URL)
  const authService = createAuthService(
    createUsersRepo(db),
    createSessionsRepo(db),
    c.env.JWT_SECRET
  )
  const result = await authService.login(email, password)
  return c.json(result, 200)
}

export const logout: RouteHandler<typeof logoutRoute, { Bindings: Env }> = async (c) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '') ?? ''
  const db = createDb(c.env.DATABASE_URL)
  const authService = createAuthService(
    createUsersRepo(db),
    createSessionsRepo(db),
    c.env.JWT_SECRET
  )
  await authService.logout(token)
  return noContent(c)
}
```

---

### Users module

#### `src/modules/users/users.schema.ts`

```ts
import { z } from '@hono/zod-openapi'

export const UserRoleSchema = z
  .enum(['admin', 'editor', 'member', 'viewer'])
  .openapi({ example: 'member' })

export const UserParamsSchema = z.object({
  id: z.string().uuid().openapi({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
})

export const CreateUserSchema = z.object({
  name: z.string().min(2).max(100).openapi({ example: 'Maria Santos' }),
  email: z.string().email().openapi({ example: 'maria@example.com' }),
  password: z.string().min(8).openapi({ example: 'supersecret123' }),
  role: UserRoleSchema.default('member'),
})

export const UpdateUserSchema = z.object({
  name: z.string().min(2).max(100).optional().openapi({ example: 'Maria Santos' }),
  role: UserRoleSchema.optional(),
})

export const UserResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().email(),
  role: UserRoleSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

// Offset pagination query
export const UsersOffsetQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1).openapi({ example: 1 }),
  perPage: z.coerce.number().int().min(1).max(100).default(20).openapi({ example: 20 }),
  search: z.string().optional().openapi({ example: 'maria' }),
  role: UserRoleSchema.optional(),
  sort: z.enum(['name', 'createdAt']).default('createdAt').openapi({ example: 'createdAt' }),
  order: z.enum(['asc', 'desc']).default('desc').openapi({ example: 'desc' }),
})

// Cursor pagination query
export const UsersCursorQuerySchema = z.object({
  cursor: z.string().optional().openapi({ example: 'eyJpZCI6ImExYjIifQ==' }),
  perPage: z.coerce.number().int().min(1).max(100).default(20),
  direction: z.enum(['next', 'prev']).default('next'),
})
```

#### `src/modules/users/users.route.ts`

```ts
import { OpenAPIHono, createRoute } from '@hono/zod-openapi'
import {
  UserParamsSchema, CreateUserSchema, UpdateUserSchema,
  UserResponseSchema, UsersOffsetQuerySchema, UsersCursorQuerySchema,
} from './users.schema'
import * as handler from './users.handler'
import { authMiddleware } from '../../middleware/auth'
import { requireRole } from '../../middleware/require-role'
import type { Env } from '../../types/env'

export const usersRoute = new OpenAPIHono<{ Bindings: Env }>()

usersRoute.use('/*', authMiddleware)

// GET /users — offset paginated list with filter + sort
export const listUsersRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['Users'],
  summary: 'List users (offset pagination)',
  security: [{ Bearer: [] }],
  request: { query: UsersOffsetQuerySchema },
  responses: {
    200: { content: { 'application/json': { schema: UserResponseSchema.array() } }, description: 'OK' },
  },
})

// GET /users/cursor — cursor paginated list
export const listUsersCursorRoute = createRoute({
  method: 'get',
  path: '/cursor',
  tags: ['Users'],
  summary: 'List users (cursor pagination)',
  security: [{ Bearer: [] }],
  request: { query: UsersCursorQuerySchema },
  responses: {
    200: { content: { 'application/json': { schema: UserResponseSchema.array() } }, description: 'OK' },
  },
})

// GET /users/:id
export const getUserRoute = createRoute({
  method: 'get',
  path: '/{id}',
  tags: ['Users'],
  summary: 'Get user by ID',
  security: [{ Bearer: [] }],
  request: { params: UserParamsSchema },
  responses: {
    200: { content: { 'application/json': { schema: UserResponseSchema } }, description: 'OK' },
    404: { description: 'Not found' },
  },
})

// POST /users
export const createUserRoute = createRoute({
  method: 'post',
  path: '/',
  tags: ['Users'],
  summary: 'Create a user',
  security: [{ Bearer: [] }],
  request: {
    body: { content: { 'application/json': { schema: CreateUserSchema } }, required: true },
  },
  responses: {
    201: { content: { 'application/json': { schema: UserResponseSchema } }, description: 'Created' },
    409: { description: 'Email already in use' },
  },
})

// PATCH /users/:id
export const updateUserRoute = createRoute({
  method: 'patch',
  path: '/{id}',
  tags: ['Users'],
  summary: 'Update a user',
  security: [{ Bearer: [] }],
  request: {
    params: UserParamsSchema,
    body: { content: { 'application/json': { schema: UpdateUserSchema } }, required: true },
  },
  responses: {
    200: { content: { 'application/json': { schema: UserResponseSchema } }, description: 'OK' },
    404: { description: 'Not found' },
  },
})

// DELETE /users/:id — admin only
export const deleteUserRoute = createRoute({
  method: 'delete',
  path: '/{id}',
  tags: ['Users'],
  summary: 'Delete a user (admin only)',
  security: [{ Bearer: [] }],
  request: { params: UserParamsSchema },
  responses: {
    204: { description: 'Deleted' },
    403: { description: 'Forbidden' },
    404: { description: 'Not found' },
  },
})

usersRoute.openapi(listUsersRoute, handler.listUsers)
usersRoute.openapi(listUsersCursorRoute, handler.listUsersCursor)
usersRoute.openapi(getUserRoute, handler.getUser)
usersRoute.openapi(createUserRoute, handler.createUser)
usersRoute.openapi(updateUserRoute, handler.updateUser)
usersRoute.use('/:id', requireRole('admin'))
usersRoute.openapi(deleteUserRoute, handler.deleteUser)
```

#### `src/modules/users/users.handler.ts`

```ts
import type { RouteHandler } from '@hono/zod-openapi'
import type {
  listUsersRoute, listUsersCursorRoute, getUserRoute,
  createUserRoute, updateUserRoute, deleteUserRoute,
} from './users.route'
import type { Env } from '../../types/env'
import { createDb } from '../../db'
import { createUsersRepo } from '../../db/repositories/users.repo'
import { createUsersService } from '../../services/users.service'
import { ok, created, noContent, paginated, cursorPaginated } from '../../lib/response'

type C = { Bindings: Env }

const getService = (c: { env: Env }) => {
  const db = createDb(c.env.DATABASE_URL)
  return createUsersService(createUsersRepo(db))
}

export const listUsers: RouteHandler<typeof listUsersRoute, C> = async (c) => {
  const { page, perPage, search, role, sort, order } = c.req.valid('query')
  const service = getService(c)
  const { rows, total } = await service.listOffset({ page, perPage, search, role, sortField: sort, sortOrder: order })

  return paginated(c, rows, { total, page, perPage }, {
    filter: { search, role },
    sort: { field: sort, order },
  })
}

export const listUsersCursor: RouteHandler<typeof listUsersCursorRoute, C> = async (c) => {
  const { cursor, perPage, direction } = c.req.valid('query')
  const service = getService(c)
  const { rows, nextCursor, prevCursor } = await service.listCursor({
    cursor: cursor ?? null,
    perPage,
    direction,
  })
  return cursorPaginated(c, rows, { nextCursor, prevCursor, perPage })
}

export const getUser: RouteHandler<typeof getUserRoute, C> = async (c) => {
  const { id } = c.req.valid('param')
  const service = getService(c)
  const user = await service.getById(id)
  return ok(c, user)
}

export const createUser: RouteHandler<typeof createUserRoute, C> = async (c) => {
  const body = c.req.valid('json')
  const service = getService(c)
  const user = await service.create(body)
  return created(c, user)
}

export const updateUser: RouteHandler<typeof updateUserRoute, C> = async (c) => {
  const { id } = c.req.valid('param')
  const body = c.req.valid('json')
  const service = getService(c)
  const user = await service.update(id, body)
  return ok(c, user)
}

export const deleteUser: RouteHandler<typeof deleteUserRoute, C> = async (c) => {
  const { id } = c.req.valid('param')
  const service = getService(c)
  await service.delete(id)
  return noContent(c)
}
```

---

### Posts module (with filter, sort, search)

#### `src/modules/posts/posts.schema.ts`

```ts
import { z } from '@hono/zod-openapi'

export const PostStatusSchema = z.enum(['draft', 'published', 'archived'])

export const PostParamsSchema = z.object({
  id: z.string().uuid(),
})

export const CreatePostSchema = z.object({
  title: z.string().min(3).max(255).openapi({ example: 'Getting started with Hono' }),
  content: z.string().min(1).openapi({ example: 'Hono is an edge-first web framework...' }),
})

export const UpdatePostSchema = z.object({
  title: z.string().min(3).max(255).optional(),
  content: z.string().min(1).optional(),
  status: PostStatusSchema.optional(),
})

export const PostResponseSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  content: z.string(),
  status: PostStatusSchema,
  authorId: z.string().uuid(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export const PostsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional().openapi({ example: 'hono', description: 'Search in title' }),
  status: PostStatusSchema.optional().openapi({ example: 'published' }),
  authorId: z.string().uuid().optional(),
  sort: z.enum(['title', 'createdAt', 'updatedAt']).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
})
```

#### `src/modules/posts/posts.route.ts`

```ts
import { OpenAPIHono, createRoute } from '@hono/zod-openapi'
import {
  PostParamsSchema, CreatePostSchema, UpdatePostSchema,
  PostResponseSchema, PostsQuerySchema,
} from './posts.schema'
import * as handler from './posts.handler'
import { authMiddleware } from '../../middleware/auth'
import { requireRole } from '../../middleware/require-role'
import type { Env } from '../../types/env'

export const postsRoute = new OpenAPIHono<{ Bindings: Env }>()

postsRoute.use('/*', authMiddleware)

export const listPostsRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['Posts'],
  summary: 'List posts with filter, sort, and pagination',
  security: [{ Bearer: [] }],
  request: { query: PostsQuerySchema },
  responses: {
    200: { content: { 'application/json': { schema: PostResponseSchema.array() } }, description: 'OK' },
  },
})

export const getPostRoute = createRoute({
  method: 'get',
  path: '/{id}',
  tags: ['Posts'],
  security: [{ Bearer: [] }],
  request: { params: PostParamsSchema },
  responses: {
    200: { content: { 'application/json': { schema: PostResponseSchema } }, description: 'OK' },
    404: { description: 'Not found' },
  },
})

export const createPostRoute = createRoute({
  method: 'post',
  path: '/',
  tags: ['Posts'],
  security: [{ Bearer: [] }],
  request: {
    body: { content: { 'application/json': { schema: CreatePostSchema } }, required: true },
  },
  responses: {
    201: { content: { 'application/json': { schema: PostResponseSchema } }, description: 'Created' },
  },
})

export const updatePostRoute = createRoute({
  method: 'patch',
  path: '/{id}',
  tags: ['Posts'],
  security: [{ Bearer: [] }],
  request: {
    params: PostParamsSchema,
    body: { content: { 'application/json': { schema: UpdatePostSchema } }, required: true },
  },
  responses: {
    200: { content: { 'application/json': { schema: PostResponseSchema } }, description: 'OK' },
    403: { description: 'Forbidden' },
    404: { description: 'Not found' },
  },
})

export const publishPostRoute = createRoute({
  method: 'post',
  path: '/{id}/publish',
  tags: ['Posts'],
  security: [{ Bearer: [] }],
  request: { params: PostParamsSchema },
  responses: {
    200: { content: { 'application/json': { schema: PostResponseSchema } }, description: 'Published' },
    403: { description: 'Forbidden' },
    404: { description: 'Not found' },
  },
})

export const deletePostRoute = createRoute({
  method: 'delete',
  path: '/{id}',
  tags: ['Posts'],
  security: [{ Bearer: [] }],
  request: { params: PostParamsSchema },
  responses: {
    204: { description: 'Deleted' },
    403: { description: 'Forbidden' },
    404: { description: 'Not found' },
  },
})

postsRoute.openapi(listPostsRoute, handler.listPosts)
postsRoute.openapi(getPostRoute, handler.getPost)
postsRoute.openapi(createPostRoute, handler.createPost)
postsRoute.use('/:id/publish', requireRole('editor'))
postsRoute.openapi(publishPostRoute, handler.publishPost)
postsRoute.openapi(updatePostRoute, handler.updatePost)
postsRoute.openapi(deletePostRoute, handler.deletePost)
```

#### `src/modules/posts/posts.handler.ts`

```ts
import type { RouteHandler } from '@hono/zod-openapi'
import type {
  listPostsRoute, getPostRoute, createPostRoute,
  updatePostRoute, publishPostRoute, deletePostRoute,
} from './posts.route'
import type { Env } from '../../types/env'
import type { AuthUser } from '../../types/common'
import { createDb } from '../../db'
import { createPostsRepo } from '../../db/repositories/posts.repo'
import { createPostsService } from '../../services/posts.service'
import { ok, created, noContent, paginated } from '../../lib/response'

type C = { Bindings: Env; Variables: { user: AuthUser } }

const getService = (c: { env: Env }) => {
  const db = createDb(c.env.DATABASE_URL)
  return createPostsService(createPostsRepo(db))
}

export const listPosts: RouteHandler<typeof listPostsRoute, C> = async (c) => {
  const { page, perPage, search, status, authorId, sort, order } = c.req.valid('query')
  const service = getService(c)
  const { rows, total } = await service.listOffset({
    page, perPage, search, status, authorId,
    sortField: sort, sortOrder: order,
  })

  return paginated(c, rows, { total, page, perPage }, {
    filter: { search, status, authorId },
    sort: { field: sort, order },
  })
}

export const getPost: RouteHandler<typeof getPostRoute, C> = async (c) => {
  const { id } = c.req.valid('param')
  const post = await getService(c).getById(id)
  return ok(c, post)
}

export const createPost: RouteHandler<typeof createPostRoute, C> = async (c) => {
  const body = c.req.valid('json')
  const user = c.get('user')
  const post = await getService(c).create({ ...body, authorId: user.id })
  return created(c, post)
}

export const updatePost: RouteHandler<typeof updatePostRoute, C> = async (c) => {
  const { id } = c.req.valid('param')
  const body = c.req.valid('json')
  const user = c.get('user')
  const post = await getService(c).update(id, user.id, body)
  return ok(c, post)
}

export const publishPost: RouteHandler<typeof publishPostRoute, C> = async (c) => {
  const { id } = c.req.valid('param')
  const user = c.get('user')
  const post = await getService(c).publish(id, user.id)
  return ok(c, post)
}

export const deletePost: RouteHandler<typeof deletePostRoute, C> = async (c) => {
  const { id } = c.req.valid('param')
  const user = c.get('user')
  await getService(c).delete(id, user.id, user.role)
  return noContent(c)
}
```

---

### Health module

#### `src/modules/health/health.route.ts`

```ts
import { OpenAPIHono } from '@hono/zod-openapi'
import { createRoute, z } from '@hono/zod-openapi'

export const healthRoute = new OpenAPIHono()

const pingRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['Health'],
  summary: 'Health check',
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            status: z.literal('ok'),
            timestamp: z.string().datetime(),
            version: z.string(),
          }),
        },
      },
      description: 'Service is healthy',
    },
  },
})

healthRoute.openapi(pingRoute, (c) =>
  c.json({
    status: 'ok' as const,
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  }, 200)
)
```

---

## Middleware

### `src/middleware/auth.ts`

```ts
import { verify } from 'hono/jwt'
import type { MiddlewareHandler } from 'hono'
import { Errors } from '../lib/errors'
import type { AuthUser } from '../types/common'

export const authMiddleware: MiddlewareHandler = async (c, next) => {
  const authHeader = c.req.header('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    throw Errors.unauthorized()
  }

  const token = authHeader.replace('Bearer ', '')

  try {
    const payload = await verify(token, c.env.JWT_SECRET)
    c.set('user', {
      id: payload.sub as string,
      email: payload.email as string,
      role: payload.role as AuthUser['role'],
    })
    await next()
  } catch {
    throw Errors.unauthorized('Token expired or invalid')
  }
}
```

### `src/middleware/require-role.ts`

```ts
import type { MiddlewareHandler } from 'hono'
import { Errors } from '../lib/errors'
import { hasRole } from '../constants/roles'
import type { UserRole } from '../types/common'

export const requireRole = (minimum: UserRole): MiddlewareHandler =>
  async (c, next) => {
    const user = c.get('user')
    if (!user) throw Errors.unauthorized()
    if (!hasRole(user.role, minimum)) throw Errors.forbidden(minimum)
    await next()
  }
```

### `src/middleware/error-handler.ts`

```ts
import type { ErrorHandler } from 'hono'
import { AppError } from '../lib/errors'
import { ZodError } from 'zod'

export const errorHandler: ErrorHandler = (err, c) => {
  // Known application error
  if (err instanceof AppError) {
    return c.json(
      { error: { code: err.code, message: err.message, details: err.details } },
      err.statusCode as any
    )
  }

  // Zod validation error (edge case — @hono/zod-openapi handles most of these)
  if (err instanceof ZodError) {
    const details = err.issues.map(i => ({
      field: i.path.join('.'),
      message: i.message,
    }))
    return c.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Request validation failed', details } },
      422
    )
  }

  // Unknown error — log and return generic 500
  console.error('[error]', err)
  return c.json(
    { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred', details: [] } },
    500
  )
}
```

### `src/middleware/request-id.ts`

```ts
import type { MiddlewareHandler } from 'hono'

export const requestId = (): MiddlewareHandler => async (c, next) => {
  const id = c.req.header('X-Request-Id') ?? crypto.randomUUID()
  c.set('requestId', id)
  c.res.headers.set('X-Request-Id', id)
  await next()
}
```

### `src/middleware/logger.ts`

```ts
import type { MiddlewareHandler } from 'hono'

export const logger = (): MiddlewareHandler => async (c, next) => {
  const start = Date.now()
  const method = c.req.method
  const path = new URL(c.req.url).pathname
  const requestId = c.get('requestId') ?? '-'

  await next()

  const ms = Date.now() - start
  const status = c.res.status
  console.log(`[${requestId}] ${method} ${path} ${status} ${ms}ms`)
}
```

### `src/middleware/cors.ts`

```ts
import { cors } from 'hono/cors'

export const corsMiddleware = (origin: string) =>
  cors({
    origin,
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
    exposeHeaders: ['X-Request-Id'],
    maxAge: 86400,
    credentials: true,
  })
```

---

## App Entry Point

### `src/index.ts`

```ts
import { OpenAPIHono } from '@hono/zod-openapi'
import { apiReference } from '@scalar/hono-api-reference'
import type { Env } from './types/env'
import { corsMiddleware } from './middleware/cors'
import { requestId } from './middleware/request-id'
import { logger } from './middleware/logger'
import { errorHandler } from './middleware/error-handler'
import { healthRoute } from './modules/health/health.route'
import { authRoute } from './modules/auth/auth.route'
import { usersRoute } from './modules/users/users.route'
import { postsRoute } from './modules/posts/posts.route'
import { wsRoute } from './modules/ws/ws.route'
import { handleScheduled } from './cron'

const app = new OpenAPIHono<{ Bindings: Env }>()

// Global middleware
app.use('*', requestId())
app.use('*', (c, next) => corsMiddleware(c.env.CORS_ORIGIN)(c, next))
app.use('*', logger())
app.onError(errorHandler)

// Register OpenAPI security scheme
app.openAPIRegistry.registerComponent('securitySchemes', 'Bearer', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
})

// Routes
app.route('/health', healthRoute)
app.route('/api/v1/auth', authRoute)
app.route('/api/v1/users', usersRoute)
app.route('/api/v1/posts', postsRoute)
app.route('/ws', wsRoute)

// OpenAPI spec
app.doc('/openapi.json', {
  openapi: '3.0.0',
  info: {
    title: 'My API',
    version: '1.0.0',
    description: 'REST API built with Hono, Drizzle, and Neon',
  },
  servers: [
    { url: 'https://my-api.workers.dev', description: 'Production' },
    { url: 'http://localhost:8787', description: 'Local' },
  ],
})

// Scalar docs UI
app.get('/docs', apiReference({ spec: { url: '/openapi.json' }, theme: 'saturn' }))

// Default export for Cloudflare Workers
export default app

// Scheduled handler for cron jobs
export const scheduled = async (
  event: ScheduledEvent,
  _env: Env,
  ctx: ExecutionContext
) => {
  ctx.waitUntil(handleScheduled({ cron: event.cron, scheduledTime: event.scheduledTime }))
}
```

---

## WebSocket

### `src/modules/ws/ws.route.ts`

```ts
import { Hono } from 'hono'
import { upgradeWebSocket } from 'hono/cloudflare-workers'
import type { Env } from '../../types/env'

// In-memory room registry — for production use Durable Objects or a pub/sub broker
const rooms = new Map<string, Set<WebSocket>>()

type WsMessage =
  | { type: 'message'; room: string; from: string; data: string; timestamp: string }
  | { type: 'join'; room: string; from: string; timestamp: string }
  | { type: 'leave'; room: string; from: string; timestamp: string }
  | { type: 'error'; message: string }

const broadcast = (room: string, payload: WsMessage, exclude?: WebSocket) => {
  const clients = rooms.get(room)
  if (!clients) return
  const text = JSON.stringify(payload)
  for (const client of clients) {
    if (client !== exclude && client.readyState === WebSocket.OPEN) {
      client.send(text)
    }
  }
}

export const wsRoute = new Hono<{ Bindings: Env }>()

// ws://localhost:8787/ws/:room?token=<jwt>
wsRoute.get(
  '/:room',
  upgradeWebSocket((c) => {
    const room = c.req.param('room')
    // Optionally validate token from query param
    const token = c.req.query('token')
    let userId = 'anonymous'

    return {
      onOpen(_event, ws) {
        if (!rooms.has(room)) rooms.set(room, new Set())
        rooms.get(room)!.add(ws.raw!)

        broadcast(room, {
          type: 'join',
          room,
          from: userId,
          timestamp: new Date().toISOString(),
        }, ws.raw!)

        ws.send(JSON.stringify({ type: 'join', room, from: 'server', timestamp: new Date().toISOString() }))
        console.log(`[ws] ${userId} joined room: ${room}`)
      },

      onMessage(event, ws) {
        try {
          const raw = typeof event.data === 'string' ? event.data : '[binary]'
          const parsed = JSON.parse(raw) as { data: string }

          broadcast(room, {
            type: 'message',
            room,
            from: userId,
            data: parsed.data,
            timestamp: new Date().toISOString(),
          }, ws.raw!)
        } catch {
          ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' } satisfies WsMessage))
        }
      },

      onClose(_event, ws) {
        rooms.get(room)?.delete(ws.raw!)
        if (rooms.get(room)?.size === 0) rooms.delete(room)

        broadcast(room, {
          type: 'leave',
          room,
          from: userId,
          timestamp: new Date().toISOString(),
        })

        console.log(`[ws] ${userId} left room: ${room}`)
      },

      onError(event) {
        console.error('[ws] error', event)
      },
    }
  })
)
```

**WebSocket message shapes**

Incoming (client → server):
```json
{ "data": "Hello everyone!" }
```

Outgoing — broadcast (server → all other clients):
```json
{
  "type": "message",
  "room": "general",
  "from": "user-uuid",
  "data": "Hello everyone!",
  "timestamp": "2026-05-04T08:30:00.000Z"
}
```

Outgoing — join/leave event:
```json
{
  "type": "join",
  "room": "general",
  "from": "user-uuid",
  "timestamp": "2026-05-04T08:30:00.000Z"
}
```

---

## Cron Jobs

### `wrangler.toml` triggers

```toml
[[triggers.crons]]
crons = [
  "*/5 * * * *",   # every 5 min — cleanup expired sessions
  "0 0 * * *",     # daily midnight — digest emails
  "0 * * * *",     # hourly — any recurring task
]
```

### `src/cron/jobs/cleanup-sessions.ts`

```ts
import { createDb } from '../../db'
import { createSessionsRepo } from '../../db/repositories/sessions.repo'
import type { Env } from '../../types/env'

export const cleanupExpiredSessions = async (env: Env) => {
  const db = createDb(env.DATABASE_URL)
  const sessionsRepo = createSessionsRepo(db)
  const count = await sessionsRepo.deleteExpired()
  console.log(`[cron:cleanup] removed ${count} expired sessions`)
}
```

### `src/cron/jobs/send-digest.ts`

```ts
import type { Env } from '../../types/env'

export const sendDailyDigest = async (_env: Env) => {
  // Example: query active users, batch send via email provider
  console.log('[cron:digest] daily digest job started')
  // await emailService.sendBatch(...)
}
```

### `src/cron/index.ts`

```ts
import type { Env } from '../types/env'
import { cleanupExpiredSessions } from './jobs/cleanup-sessions'
import { sendDailyDigest } from './jobs/send-digest'

interface ScheduledEvent {
  cron: string
  scheduledTime: number
}

export const handleScheduled = async (event: ScheduledEvent, env: Env) => {
  console.log(`[cron] triggered: ${event.cron} at ${new Date(event.scheduledTime).toISOString()}`)

  switch (event.cron) {
    case '*/5 * * * *':
      await cleanupExpiredSessions(env)
      break
    case '0 0 * * *':
      await sendDailyDigest(env)
      break
    default:
      console.warn(`[cron] no handler registered for: ${event.cron}`)
  }
}
```

---

## OpenAPI & Docs

The docs are auto-generated — no YAML to write. Once the app is running:

| URL | Description |
|---|---|
| `GET /openapi.json` | Raw OpenAPI 3.0 spec |
| `GET /docs` | Scalar interactive docs UI |

The spec is built from your Zod schemas. Every `createRoute()` call contributes:
- Path parameters, query parameters, request body
- Response schemas per status code
- Tags for grouping
- Security requirements

To add examples to the spec, use `.openapi({ example: '...' })` on any Zod field.

---

## Project Config Files

### `package.json`

```json
{
  "name": "my-api",
  "version": "1.0.0",
  "scripts": {
    "dev": "wrangler dev src/index.ts",
    "deploy": "wrangler deploy",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:studio": "drizzle-kit studio",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "hono": "^4.4.0",
    "@hono/zod-openapi": "^0.16.0",
    "@scalar/hono-api-reference": "^0.5.0",
    "@neondatabase/serverless": "^0.9.0",
    "drizzle-orm": "^0.30.0",
    "bcryptjs": "^2.4.3",
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "wrangler": "^3.0.0",
    "drizzle-kit": "^0.21.0",
    "typescript": "^5.4.0",
    "@cloudflare/workers-types": "^4.0.0",
    "@types/bcryptjs": "^2.4.6"
  }
}
```

### `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "lib": ["ESNext"],
    "types": ["@cloudflare/workers-types"],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### `wrangler.toml`

```toml
name = "my-api"
main = "src/index.ts"
compatibility_date = "2025-01-01"
compatibility_flags = ["nodejs_compat"]

[vars]
NODE_ENV = "production"
CORS_ORIGIN = "https://myapp.com"

[[kv_namespaces]]
binding = "KV"
id = "your-kv-namespace-id"

[[triggers.crons]]
crons = ["*/5 * * * *", "0 0 * * *"]
```

### `drizzle.config.ts`

```ts
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './src/db/schema/index.ts',
  out: './src/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
})
```

---

## Query Examples

### Offset pagination with filter and sort

```
GET /api/v1/posts?page=1&perPage=20&status=published&sort=createdAt&order=desc
GET /api/v1/posts?page=2&perPage=10&search=hono&sort=title&order=asc
GET /api/v1/users?page=1&perPage=20&role=admin&search=maria
```

### Cursor pagination

```
# First page
GET /api/v1/users/cursor?perPage=20

# Next page (use nextCursor from previous response)
GET /api/v1/users/cursor?cursor=eyJpZCI6ImIyYzMifQ==&perPage=20&direction=next

# Previous page
GET /api/v1/users/cursor?cursor=eyJpZCI6ImExYjIifQ==&perPage=20&direction=prev
```

### Filtering posts by author

```
GET /api/v1/posts?authorId=a1b2c3d4-e5f6-7890-abcd-ef1234567890&status=published
```

---

## Architecture Summary

```
Request
  └─ Global middleware (requestId → cors → logger)
       └─ Route → OpenAPI validation (Zod)
            └─ Auth middleware (JWT verify)
                 └─ Role guard (optional, per route)
                      └─ Handler (parse valid input, call service)
                           └─ Service (business logic, throws AppError)
                                └─ Repository (Drizzle query, no logic)
                                     └─ Database (Neon Postgres)

Error path:
  AppError thrown anywhere
    └─ Bubbles to onError(errorHandler)
         └─ Returns { error: { code, message, details } }
```

This structure keeps every concern isolated. Adding a new domain means creating one folder under `modules/`, one service, and one repository — nothing else needs to change.
