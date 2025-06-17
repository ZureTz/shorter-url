-- Table that contains the long URLs and their corresponding short codes, also other metadata.
create table
  if not exists urls (
    id bigserial primary key,
    original_url text not null,
    short_code text not null unique,
    is_custom boolean not null default false,
    created_at timestamp not null default current_timestamp,
    expired_at timestamp not null
  );

-- Note
-- There's no need to manually create indexes on unique columns; 
-- doing so would just duplicate the automatically-created index.
-- Index for quick lookups by expiration date
create index idx_urls_expired_at on urls (expired_at);

-- Users table to manage user accounts
create table
  if not exists users (
    id bigserial primary key,
    -- Snowflake ID for unique user identification
    user_id text not null unique,
    username text not null unique,
    password_hash text not null,
    email text not null unique,
    created_at timestamp not null default current_timestamp
  );