# Deployment Setup

## 1. Supabase — run this SQL once in your project's SQL Editor

```sql
-- Account plans table (one row per salesperson)
create table public.account_plans (
  id           uuid default gen_random_uuid() primary key,
  user_id      uuid references auth.users not null unique,
  display_name text,
  data         jsonb not null default '{}',
  updated_at   timestamptz default now()
);

-- Enable row-level security
alter table public.account_plans enable row level security;

-- Each user can only read and write their own row
create policy "Users manage own plans"
  on public.account_plans for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Admin override table
create table public.admin_users (
  user_id uuid references auth.users primary key
);

-- Admins can read all plans
create policy "Admins read all plans"
  on public.account_plans for select
  using (
    exists (select 1 from public.admin_users where user_id = auth.uid())
  );
```

## 2. Supabase — create user accounts

In Supabase Dashboard → Authentication → Users → Invite user (or Add user):
- Create one account per salesperson (email + temporary password)
- To make someone an admin: after they first sign in, find their user_id in the Users table,
  then run: `insert into public.admin_users (user_id) values ('<their-uuid>');`

## 3. Fill in the app config

In `apps/account-planner/index.html`, find these two lines near the top of the `<script>`:

```js
const SUPABASE_URL      = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
```

Replace with your project values from:
Supabase Dashboard → Project Settings → API → Project URL + anon/public key

## 4. Netlify — environment variables

In Netlify Dashboard → Site → Environment Variables, add:

| Variable            | Value                        |
|---------------------|------------------------------|
| `ANTHROPIC_API_KEY` | Your Anthropic API key       |

The Supabase URL and anon key go in the HTML (they are safe to expose — RLS enforces security).

## 5. Netlify — deploy settings

- Base directory: (leave blank / repo root)
- Publish directory: `apps/account-planner`
- Functions directory: `netlify/functions`

These are already configured in `netlify.toml` at the repo root.
