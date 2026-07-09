# Gotion

A personal productivity workspace — Notion-style notes, task management, a
Pomodoro timer, sleep tracking, habit streaks, and a supportive quit tracker,
all in one app.

## Stack

- Next.js 15 (App Router) + TypeScript (strict)
- Tailwind CSS + shadcn/ui
- Prisma 7 (SQLite locally via `@prisma/adapter-libsql`; swap to Postgres/Supabase for production)
- Recharts
- dnd-kit (Kanban board)

## Getting started

```bash
npm install
cp .env.example .env.local   # then edit APP_PASSCODE and AUTH_SECRET
npx prisma migrate dev
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You'll be asked for the
passcode set in `.env.local` (`APP_PASSCODE`) — this app has no multi-user
auth, just a single passcode gate.

## Moving to Postgres (e.g. Supabase) for deployment

1. In `prisma/schema.prisma`, change the datasource `provider` to `"postgresql"`.
2. Swap the libsql driver adapter for `@prisma/adapter-pg` in `src/lib/db.ts`
   and `prisma.config.ts`, pointed at `DATABASE_URL`.
3. `npx prisma migrate dev`.

## Notes

- `npm run build` uses webpack, not Turbopack — Turbopack currently fails on
  a LICENSE-file parsing bug in `@libsql`'s dependency tree
  ([vercel/next.js#82881](https://github.com/vercel/next.js/issues/82881)).
  `npm run dev` still uses Turbopack.
