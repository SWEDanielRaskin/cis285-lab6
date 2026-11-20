# SplitSmart prototype (Lab 9)

A web app for sharing expenses within a group: create groups, add members, record
expenses split equally, see the expense history, and see who owes whom.

Stack: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS 4, Prisma 6, SQLite.

## Run it

From this `prototype/` folder:

```bash
npm install                 # first time only
npx prisma migrate deploy   # creates/updates prisma/dev.db from prisma/migrations
npm run dev                 # http://localhost:3000
```

`.env` must contain `DATABASE_URL="file:./dev.db"`. The path is relative to
`prisma/schema.prisma`, so the database file is `prisma/dev.db`.

To start over with an empty database, stop the server, delete `prisma/dev.db`, and run
`npx prisma migrate deploy` again.

## Tests

```bash
npm test                         # unit tests for money, split and balance logic (vitest)
npm run smoke                    # end-to-end API test; needs `npm run dev` running
npm run smoke -- --check <id>    # after restarting the server: is group <id> still intact?
npm run lint
```

`npm run smoke` writes real test groups into `prisma/dev.db`.

## How it works

| Layer | Folder | Job |
|---|---|---|
| UI | `src/components/`, `src/app/page.tsx` | React client components. They talk to the API through `src/lib/apiClient.ts` |
| API | `src/app/api/groups/**/route.ts` | Next.js route handlers. Turn errors into `400 {error, field}` or `404 {error}` |
| Services | `src/lib/services/` | Validate input and run each change in one Prisma transaction |
| Domain | `src/lib/domain/` | Pure functions: parse money, split amounts, calculate balances |
| Persistence | `prisma/schema.prisma`, `src/lib/db.ts` | Prisma Client over SQLite |

Design diagrams (PlantUML) are in [`uml/`](uml/).

### API

| Method | Path | Body | Returns |
|---|---|---|---|
| GET | `/api/groups` | | groups, newest first |
| POST | `/api/groups` | `{ name }` | the new group (201) |
| GET | `/api/groups/:id` | | members, expenses, balances, settle-up suggestions |
| GET / POST | `/api/groups/:id/members` | `{ name }` | members / the new member (201) |
| GET / POST | `/api/groups/:id/expenses` | `{ description, amount: "12.50", payerId, participantIds: [] }` | expenses / the new expense (201) |
| GET | `/api/groups/:id/balances` | | balances, their sum, settle-up suggestions |

### Money rules

- Amounts are held as **integer cents** everywhere. The parser reads the text digit by
  digit and never goes through floating point.
- Amounts must be $0.01–$1,000,000.00 with at most two decimal places. Extra decimals are
  refused, not rounded.
- **Equal split:** everyone gets `floor(amount / n)` cents. The leftover cents go one each
  to the participants in listed order (the group's member order), starting with the first.
  $10.00 split three ways is $3.34, $3.33, $3.33.
- **Balance** = paid − share. Positive means the member should receive money; negative
  means they owe. Balances are not stored. They are recalculated from the saved shares on
  every read, and their sum is always $0.00.
- The payer and every participant must be members of the expense's group. This is checked
  on the server inside the same transaction that saves the expense.

## Not in this prototype

There are no user accounts or login, payments or settlements recorded, percentage splits,
approval workflow, notifications, reports, or editing and deleting. Those parts of the
full spec are out of scope for Lab 9.
