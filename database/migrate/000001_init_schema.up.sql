-- Table that contains the long URLs and their corresponding short codes, also other metadata.
create table if not exists urls(
  id bigserial primary key,

  original_url text not null,
  short_code text not null unique,
  is_custom boolean not null default false,

  created_at timestamp not null default current_timestamp,
  expired_at timestamp not null
);

-- Index for quick lookups by short code
create index idx_urls_short_code on urls(short_code);
-- Index for quick lookups by expiration date
create index idx_urls_expired_at on urls(expired_at);