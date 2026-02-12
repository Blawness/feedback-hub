---
trigger: always_on
---

You are an expert in TypeScript, Node.js, Next.js 16 App Router, React 19, Shadcn UI, Radix UI, Tailwind, and Prisma ORM.

Code Style and Structure
- Write concise, technical TypeScript code with accurate examples.
- Use functional and declarative programming patterns; avoid classes.
- Prefer iteration and modularization over code duplication.
- Use descriptive variable names with auxiliary verbs (e.g., isLoading, hasError).
- Structure files: exported component, subcomponents, helpers, static content, types.
- Follow Next.js 16+ and React 19 best practices.

Naming Conventions
- Use lowercase with dashes for directories (e.g., components/auth-wizard).
- Favor named exports for components.

TypeScript Usage
- Use TypeScript for all code; prefer interfaces over types.
- Avoid enums; use maps or as const objects instead.
- Use functional components with TypeScript interfaces.
- Utilize proper type inference; avoid explicit typing where types can be inferred.

Syntax and Formatting
- Use the "function" keyword for pure functions.
- Avoid unnecessary curly braces in conditionals; use concise syntax for simple statements.
- Use declarative JSX.

UI and Styling
- Use Shadcn UI, Radix, and Tailwind for components and styling.
- Implement responsive design with Tailwind CSS; use a mobile-first approach.
- Use Tailwind's core utility classes - avoid custom CSS.

React and Next.js Best Practices
- Minimize 'use client', 'useEffect', and 'setState'; favor React Server Components (RSC).
- Use Server Actions for mutations instead of traditional API routes.
- Leverage React 19 features:
  - use() hook for reading promises and context
  - useActionState() for form states  
  - useFormStatus() for form submission states
  - useOptimistic() for optimistic UI updates
  - View Transitions for smooth animations
- Wrap client components in Suspense with fallback.
- Use dynamic loading for non-critical components.
- Implement proper error boundaries for client-side errors.
- Use proxy.ts instead of middleware.ts (deprecated in Next.js 16).

Performance Optimization
- Turbopack is now stable and default - no --turbopack flag needed.
- Optimize images: use Next.js Image component with AVIF/WebP formats.
- Implement route prefetching and code splitting.
- Optimize Core Web Vitals (LCP, INP, CLS):
  - LCP: < 2.5s
  - INP: < 200ms (replaces FID)
  - CLS: < 0.1
- Minimize JavaScript bundle size; use dynamic imports.
- Use Turbopack File System Caching (stable) for faster dev server restarts.
- Enable React Compiler for automatic optimizations (stable in Next.js 16).

Cache Components (Next.js 16 New Feature)
- Enable cacheComponents in next.config.ts
- Use 'use cache' directive for explicit caching control
- Combine with cacheLife() for cache duration control
- Use cacheTag() for selective invalidation
- Three cache directives available:
  - 'use cache' - standard caching
  - 'use cache: remote' - shared cache across instances
  - 'use cache: private' - per-user caching (can access cookies)
- Cache Components work with Partial Prerendering (PPR) by default
- Wrap dynamic parts in <Suspense> for optimal PPR

Example cache usage:
```typescript
// Basic caching
async function ProductList() {
  'use cache'
  cacheLife('hours') // Uses preset profile
  const products = await db.product.findMany()
  return <div>{products.map(p => <ProductCard key={p.id} {...p} />)}</div>
}

// Custom cache profile
import { cacheLife } from 'next/cache'

async function BlogPost() {
  'use cache'
  cacheLife({
    stale: 3600,      // 1 hour
    revalidate: 900,  // 15 minutes  
    expire: 86400,    // 1 day
  })
  const post = await db.post.findFirst()
  return <Article post={post} />
}

// With cache tags for invalidation
import { cacheTag } from 'next/cache'

async function UserProfile({ userId }: { userId: string }) {
  'use cache'
  cacheTag('user-profile', `user:${userId}`)
  const user = await db.user.findUnique({ where: { id: userId } })
  return <Profile user={user} />
}

// Invalidate from Server Action
'use server'
import { revalidateTag } from 'next/cache'

export async function updateProfile(userId: string) {
  await db.user.update(...)
  revalidateTag(`user:${userId}`)
}
```

Preset cache profiles:
- 'seconds' - Very short-lived (stale: 15s)
- 'minutes' - Short-lived (stale: 5min)
- 'hours' - Medium-lived (stale: 1hr)
- 'days' - Long-lived (stale: 1 day)
- 'weeks' - Very long-lived (stale: 1 week)
- 'max' - Maximum duration (stale: 1 year)

Data Fetching and State Management
- Use server components for data fetching where possible.
- Implement SWR or React Query for client-side data fetching and caching.
- Minimize 'use client':
  - Favor server components and Next.js SSR features.
  - Use only for Web API access in small components.
  - Avoid for data fetching or state management.
- For global state, consider Zustand or context API with proper memoization.

Database and ORM (Prisma)
- Use Prisma ORM for type-safe database operations.
- Structure Prisma schema with clear models and relations.
- Implement proper database indexes using @@index.
- Use relationMode = "prisma" for databases like PlanetScale.
- Leverage Prisma Client best practices:
  - Use select to retrieve only needed fields
  - Implement proper pagination with skip/take
  - Use transactions for complex operations
  - Handle errors appropriately with try-catch
  - Use middleware for logging, soft deletes, etc.
- Avoid N+1 queries; use include or nested selects.
- Use prisma db push for schema changes in development.
- Implement connection pooling for serverless environments.

Example Prisma structure:
```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  posts     Post[]
  createdAt DateTime @default(now())
  
  @@index([email])
}

model Post {
  id        String   @id @default(cuid())
  title     String
  content   String   @db.Text
  published Boolean  @default(false)
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  createdAt DateTime @default(now())
  
  @@index([userId])
  @@index([published])
}
```

Example Prisma usage with cache:
```typescript
import { prisma } from '@/lib/prisma'
import { cacheLife } from 'next/cache'

async function getPublishedPosts() {
  'use cache'
  cacheLife('hours')
  
  return await prisma.post.findMany({
    where: { published: true },
    select: {
      id: true,
      title: true,
      content: true,
      user: {
        select: {
          id: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })
}
```

Routing and Navigation
- Use Next.js App Router conventions (app directory).
- Implement layouts for shared UI across routes.
- Use route groups for organization without affecting URL structure.
- Leverage parallel routes and intercepting routes for advanced patterns.
- Use proxy.ts for request interception (replaces middleware.ts).

Proxy Configuration (New in Next.js 16):
```typescript
// proxy.ts (replaces middleware.ts)
import { NextRequest, NextResponse } from 'next/server'

export function proxy(request: NextRequest) {
  // Runs on Node.js runtime (not Edge)
  if (request.nextUrl.pathname.startsWith('/admin')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
```

Security
- Implement proper CSRF protection.
- Sanitize user inputs to prevent XSS attacks.
- Use environment variables for sensitive data; never commit secrets.
- Implement rate limiting on API routes and server actions.
- Use Next.js built-in security headers.

Error Handling and Validation
- Use Zod for runtime validation and type safety.
- Implement proper error boundaries in React.
- Handle loading and error states appropriately.
- Use error.tsx and loading.tsx conventions in Next.js.

Testing
- Write unit tests for utilities and components using Jest and React Testing Library.
- Implement integration tests for critical user flows.
- Use Playwright for E2E testing.

Documentation
- Use JSDoc for function documentation.
- Maintain a clear README with setup instructions.
- Document environment variables and configuration.

Key Conventions
- Follow Next.js 16+ documentation for Data Fetching, Rendering, and Routing.
- Optimize Web Vitals (LCP, INP, CLS) - INP is the new responsiveness metric.
- Use Turbopack (stable and default since Next.js 16).
- Implement React Compiler for automatic optimizations.
- Use 'use cache' directive with cacheLife for explicit caching.
- Leverage Partial Prerendering (PPR) with Cache Components.
- Use proxy.ts instead of middleware.ts.
- Leverage streaming with Suspense for better perceived performance.

Folder Structure (Feature-based):
```
app/
├── (marketing)/
│   ├── page.tsx
│   └── layout.tsx
├── (dashboard)/
│   ├── page.tsx
│   └── layout.tsx
├── api/
lib/
├── prisma.ts          # Prisma client singleton
├── actions/           # Server actions
├── utils/
└── validations/       # Zod schemas
prisma/
├── schema.prisma
└── migrations/
components/
├── ui/                # Shadcn components
├── forms/
└── shared/
public/
types/
proxy.ts               # Request interception (replaces middleware.ts)
```

Next.js 16 Upgrade Notes:
- Turbopack is now default (remove --turbopack flags from package.json)
- Enable cacheComponents: true in next.config.ts for Cache Components
- Rename middleware.ts → proxy.ts and middleware function → proxy
- React Compiler is stable (enable with reactCompiler: true in config)
- Use 'use cache' instead of unstable_cache or revalidate export
- PPR is integrated with Cache Components (no separate ppr flag)

Next.js Config Example:
```typescript
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  cacheComponents: true,
  reactCompiler: true,
  cacheLife: {
    // Custom cache profiles
    blog: {
      stale: 3600,      // 1 hour
      revalidate: 900,  // 15 minutes
      expire: 86400,    // 1 day
    },
  },
}

export default nextConfig
```

Follow official Next.js, React, and Prisma documentation for the latest best practices.