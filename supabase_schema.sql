-- Moods Table
create table moods (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  date date not null,
  mood text not null, -- 'A', 'B', 'C', 'D', 'F'
  note text,
  positive_note text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, date)
);

-- Enable Row Level Security (RLS)
alter table moods enable row level security;

-- Policies
create policy "Users can view own moods" on moods
  for select using (auth.uid() = user_id);

create policy "Users can insert own moods" on moods
  for insert with check (auth.uid() = user_id);

create policy "Users can update own moods" on moods
  for update using (auth.uid() = user_id);

create policy "Users can delete own moods" on moods
  for delete using (auth.uid() = user_id);

-- Profiles Table
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable RLS for profiles
alter table profiles enable row level security;

-- Policies for profiles
create policy "Users can view own profile" on profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on profiles
  for update using (auth.uid() = id);

-- Trigger to create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
