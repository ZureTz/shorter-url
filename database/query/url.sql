-- name: CreateURL :one
insert into urls (
  original_url,
  short_code,
  is_custom,
  expired_at,
  created_by
) values (
  $1, $2, $3, $4, $5
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

-- name: GetUserShortURLs :many
select 
  *
from
  urls
where 
  created_by = $1
  and (
    expired_at is null
    or
    expired_at > current_timestamp
  )
order by
  created_at desc
limit $2 offset $3
;

-- name: DeleteOutdatedURLs :exec
delete from
  urls
where 
  expired_at is not null
  and
  expired_at <= current_timestamp
;

-- name: DeleteURLFromId :exec
delete from
  urls
where 
  id = $1
  and
  created_by = $2
;
