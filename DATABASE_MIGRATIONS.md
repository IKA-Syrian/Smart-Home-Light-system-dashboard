# Database Migration System Implementation

## Overview

A database migration system has been implemented to solve the missing DailySchedules table issue and prevent similar problems in the future. This system allows for version-controlled database schema changes that can be applied consistently across all environments.

## What Was Fixed

The original issue was caused by:

-   The DailySchedules table was missing in the database
-   Database synchronization was not reliably creating all tables
-   Using `force: true` with Sequelize sync risked data loss by dropping existing tables

The solution implements:

1. A proper migration system using Sequelize-CLI and Umzug
2. Migration files for DailySchedules and EnergyLogs tables
3. A system that can be extended with future database changes

## How to Use the Migration System

### Available Commands

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

### Creating a New Migration

When you need to make database changes:

1. Create a new migration file:

    ```bash
    npm run migration:generate add-new-feature
    ```

2. Edit the generated file in `src/db/migrations/YYYYMMDDHHMMSS-add-new-feature.js`

3. Implement the `up` and `down` functions:

    ```javascript
    // For ES Module format
    const migration = {
      up: async (queryInterface, Sequelize) => {
        // Code to apply the change
        await queryInterface.createTable(...);
      },
      down: async (queryInterface, Sequelize) => {
        // Code to revert the change
        await queryInterface.dropTable(...);
      }
    };

    export default migration;
    ```

4. Run the migration:
    ```bash
    npm run migration:up
    ```

## Benefits of the New System

1. **No Data Loss**: Migrations make specific changes without dropping existing data
2. **Version Control**: Database changes are tracked alongside code changes
3. **Consistent Deployments**: All environments get the same database structure
4. **Team Collaboration**: Everyone works with the same database schema
5. **Rollback Capability**: Can revert to previous database states if needed

## File Structure

-   `src/db/migrations/`: Contains all migration files
-   `src/db/seeders/`: For database seed files (optional)
-   `scripts/runMigrations.js`: Helper script to execute migrations
-   `.sequelizerc`: Configuration for Sequelize CLI

## System Implementation Details

The migration system uses:

-   **Sequelize-CLI**: For migration file generation
-   **Umzug**: For migration execution
-   **ES Module Support**: Compatible with the project's ES module structure

The server startup process has been updated to:

1. Connect to the database
2. Run any pending migrations
3. Fall back to basic sync only if migrations fail

## Troubleshooting

If you encounter issues with migrations:

1. Check migration status: `npm run migration:status`
2. Review error messages in the console
3. Check that migration files are properly formatted for ES modules
4. Ensure database connection parameters are correct

For more information on migrations, see the documentation in `src/db/README.md`.
