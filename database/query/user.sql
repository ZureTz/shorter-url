-- name: GetUserInfoFromUsername :one
select
  *
from
  users
where
  username = $1
;

-- name: IsNewUserAvailable :one
select not exists (
  select 
    1 
  from 
    users 
  where 
    username = $1
    or email = $2
) as is_available;

-- name: GetUserInfoFromUserID :one
select
  *
from
  users
where
  user_id = $1
;

-- name: CreateNewUser :exec
insert into users (
  user_id,
  username,
  password_hash,
  email
) values (
  $1, $2, $3, $4
);