-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- PROFILES
create type subscription_tier as enum ('wanderer', 'keeper', 'lifer');

create table public.profiles (
  id uuid references auth.users not null primary key,
  username text unique,
  avatar_url text,
  subscription_tier subscription_tier default 'wanderer',
  current_streak int default 0,
  freeze_tokens int default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

-- BOOKS (Cache Layer)
create table public.books (
  isbn text primary key,
  title text not null,
  author text,
  cover_url text,
  total_pages int,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.books enable row level security;

create policy "Books are viewable by everyone."
  on books for select
  using ( true );

create policy "Authenticated users can insert books."
  on books for insert
  with check ( auth.role() = 'authenticated' );

-- OR allow anon if you want global contribution
-- create policy "Anon books insert" on books for insert with check (true);


-- SHELVES
create type book_status as enum ('reading', 'read', 'tbr');

create table public.shelves (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) not null,
  book_isbn text references public.books(isbn) not null,
  status book_status default 'tbr',
  current_page int default 0,
  rating int check (rating >= 0 and rating <= 5),
  updated_at timestamp with time zone default timezone('utc'::text, now()),
  unique(user_id, book_isbn)
);

alter table public.shelves enable row level security;

create policy "Users can see their own shelf and friends shelves."
  on shelves for select
  using ( true ); -- Simplified for now, refine for privacy later

create policy "Users can insert into own shelf."
  on shelves for insert
  with check ( auth.uid() = user_id );

create policy "Users can update own shelf."
  on shelves for update
  using ( auth.uid() = user_id );

-- SESSIONS
create table public.sessions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) not null,
  book_isbn text references public.books(isbn),
  start_time timestamp with time zone default timezone('utc'::text, now()),
  end_time timestamp with time zone,
  duration_seconds int default 0,
  pages_read int default 0,
  photo_log_url text
);

alter table public.sessions enable row level security;

create policy "Sessions are viewable by everyone."
  on sessions for select
  using ( true );

create policy "Users can insert own sessions."
  on sessions for insert
  with check ( auth.uid() = user_id );

create policy "Users can update own sessions."
  on sessions for update
  using ( auth.uid() = user_id );

-- FRIENDSHIPS
create type friendship_status as enum ('pending', 'accepted');

create table public.friendships (
  id uuid default uuid_generate_v4() primary key,
  user_a uuid references public.profiles(id) not null,
  user_b uuid references public.profiles(id) not null,
  status friendship_status default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()),
  unique(user_a, user_b)
);

alter table public.friendships enable row level security;

create policy "Users can see their own friendships."
  on friendships for select
  using ( auth.uid() = user_a or auth.uid() = user_b );

create policy "Users can insert friendship requests."
  on friendships for insert
  with check ( auth.uid() = user_a );

create policy "Users can update friendships (accept)."
  on friendships for update
  using ( auth.uid() = user_b or auth.uid() = user_a ); 

-- CHAT MESSAGES
create type message_type as enum ('text', 'nudge');

create table public.chat_messages (
  id uuid default uuid_generate_v4() primary key,
  session_id uuid, -- Optional, could be room_id or linked to a session
  user_id uuid references public.profiles(id) not null,
  content text,
  type message_type default 'text',
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.chat_messages enable row level security;

create policy "Chat messages are viewable by everyone (global fire)."
  on chat_messages for select
  using ( true );

create policy "Users can insert messages."
  on chat_messages for insert
  with check ( auth.uid() = user_id );

-- QUOTES
create table public.quotes (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) not null,
  book_isbn text references public.books(isbn),
  content text not null,
  page_number int,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.quotes enable row level security;

create policy "Quotes are viewable by everyone."
  on quotes for select
  using ( true );

create policy "Users can insert own quotes."
  on quotes for insert
  with check ( auth.uid() = user_id );

-- BINGO CARDS
create table public.bingo_cards (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) not null,
  season_id text, -- e.g., 'winter_2025'
  grid_data jsonb, -- Stores the state of the card
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.bingo_cards enable row level security;

create policy "Users can see own bingo cards."
  on bingo_cards for select
  using ( auth.uid() = user_id ); -- maybe friends too?

create policy "Users can insert/update own bingo cards."
  on bingo_cards for insert
  with check ( auth.uid() = user_id );
