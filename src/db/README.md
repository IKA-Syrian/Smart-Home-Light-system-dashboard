# Database Migrations for IoT Project

This directory contains database migrations for the IoT Project. Migrations help track and manage database schema changes over time.

## Migration Directory Structure

-   `/migrations`: Contains all database migration files
-   `/seeders`: Contains database seed files for populating test data

## How Migrations Work

Migrations are time-stamped files that contain code to:

-   Create or modify database tables, columns, indexes, etc. (`up` function)
-   Revert those changes if needed (`down` function)

Migrations run in chronological order based on their timestamp prefix.

## Using Migrations

The project includes several npm scripts to manage migrations:

```bash
# Check migration status
npm run migration:status

# Apply all pending migrations
npm run migration:up

# Revert the last batch of migrations
npm run migration:down

# Generate a new migration file
npm run migration:generate my-migration-name
```

## Benefits of Using Migrations

1. **Version Control for Your Database**: Track schema changes alongside code changes
2. **Safer Deployments**: Avoid manual SQL scripts and ensure consistent database structure
3. **Team Collaboration**: Everyone works with the same database structure
4. **Environment Consistency**: Dev, test, and production environments stay in sync
5. **Rollback Capability**: Revert to previous database states if needed

## Creating a New Migration

When you need to make database changes:

1. Create a new migration file: `npm run migration:generate add-new-feature`
2. Edit the generated file in `src/db/migrations`
3. Implement the `up` and `down` functions
4. Run `npm run migration:up` to apply the changes

## Best Practices

-   Each migration should be focused on a single database change
-   Always implement both `up` and `down` functions
-   Test migrations in development before applying to production
-   Don't modify existing migration files that have been applied to production
