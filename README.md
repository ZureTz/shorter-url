# shorter-url
A SaaS that shortens url to make it cleaner to share.

## Install dependencies

### Migrate

Install migrate for PostgreSQL migrations:
```bash
go install -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@latest
```

### SQLc

Install SQLc for generating Go code from SQL queries:
```bash
go install github.com/sqlc-dev/sqlc/cmd/sqlc@latest
```

## Environment setup

### PostgreSQL

Run postgres in a docker container:

```bash
docker run --name postgres-urls \
	         -e POSTGRES_USER=user \
	         -e POSTGRES_PASSWORD=pass \
	         -e POSTGRES_DB=url_db \
	         -p 5432:5432 \
	         -d postgres
```

### Redis

Run redis in a docker container:

```bash
docker run --name redis-url \
           -p 6379:6379 \
           -d redis
```

### Migrate up the database

```bash
migrate -path database/migrate \
        -database "postgres://user:pass@localhost:5432/url_db?sslmode=disable" \
        up
```

### Migrate drop the database (if necessary)

```bash
migrate -path database/migrate \
        -database "postgres://user:pass@localhost:5432/url_db?sslmode=disable" \
        drop -f
```

### Set timezone of database to UTC in PostgreSQL

Make sure to set the timezone in PostgreSQL to UTC. You can do this by running the following command in the PostgreSQL shell:
```sql
ALTER DATABASE url_db SET timezone TO 'UTC';
```

## Copy example config file
```bash
cp config.example.toml config.toml
```

And edit the `config.toml` file with your database and redis credentials.

## Run the application

```bash
go run main.go
```

