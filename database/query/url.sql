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
  select 
    1 
  from 
    urls 
  where 
    short_code = $1
) as is_available;

-- name: GetURLByShortCode :one
select 
  * 
from 
  urls 
where 
  short_code = $1
  and (
    expired_at is null
    or
    expired_at > current_timestamp
  )
;

-- name: DeleteOutdatedURLs :exec
delete from
  urls
where 
  expired_at is not null
  and
  expired_at <= current_timestamp
;

