-- name: CreateURL :one
insert into urls (
  original_url,
  short_code,
  is_custom,
  expired_at
) values (
  $1, $2, $3, $4
) returning *;

-- name: IsShortCodeAvailable :one
select not exists (
  select 1 from urls where short_code = $1
) as is_available;
