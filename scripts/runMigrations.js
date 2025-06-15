import { Umzug, SequelizeStorage } from 'umzug';
import path from 'path';
import { fileURLToPath } from 'url';
import db from '../src/models/index.js';

console.log('Migration script starting...');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

console.log('Creating migration instance...');

// Create umzug instance for handling migrations
const umzug = new Umzug({
    migrations: {
        glob: path.join(rootDir, './src/db/migrations/*.js'),
        resolve: ({ name, path, context }) => {
            // Dynamically import ESM migration
            return import(path).then(migration => {
                return {
                    name,
                    up: async () => migration.default.up(context.queryInterface, context.Sequelize),
                    down: async () => migration.default.down(context.queryInterface, context.Sequelize),
                };
            });
        },
    },
    context: {
        queryInterface: db.sequelize.getQueryInterface(),
        Sequelize: db.Sequelize
    },
    storage: new SequelizeStorage({ sequelize: db.sequelize }),
    logger: console,
});

// Helper function to run migrations
async function runMigrations() {
    console.log('runMigrations function called');
    const command = process.argv[2] || 'status';
    console.log(`Command: ${command}`);

    try {
        switch (command) {
            case 'up':
                console.log('Running pending migrations...');
                const pendingMigrations = await umzug.pending();

                if (pendingMigrations.length === 0) {
                    console.log('No pending migrations to execute.');
                } else {
                    console.log(`Found ${pendingMigrations.length} pending migrations:`);
                    pendingMigrations.forEach(migration => {
                        console.log(` - ${migration.name}`);
                    });

                    await umzug.up();
                    console.log('All migrations have been executed successfully.');
                }
                break;
            case 'down':
                console.log('Reverting the last batch of migrations...');
                const executedMigrations = await umzug.executed();

                if (executedMigrations.length === 0) {
                    console.log('No migrations to revert.');
                } else {
                    console.log(`Will revert last migration: ${executedMigrations[executedMigrations.length - 1].name}`);
                    await umzug.down();
                    console.log('Last migration has been reverted successfully.');
                }
                break;
            case 'status':
            default:
                console.log('Running status check...');
                const pending = await umzug.pending();
                const executed = await umzug.executed();

                console.log(`\nMigration Status:`);
                console.log(`-----------------`);
                console.log(`Executed migrations: ${executed.length}`);
                console.log(`Pending migrations: ${pending.length}`);

                if (executed.length > 0) {
                    console.log('\nExecuted migrations:');
                    executed.forEach(migration => {
                        console.log(` - ${migration.name}`);
                    });
                }

                if (pending.length > 0) {
                    console.log('\nPending migrations:');
                    pending.forEach(migration => {
                        console.log(` - ${migration.name}`);
                    });
                }

                // Add check for required tables
                console.log('\nChecking required tables...');
                const queryInterface = db.sequelize.getQueryInterface();
                console.log('Getting tables list...');
                const tables = await queryInterface.showAllTables();
                console.log(`Found ${tables.length} tables in database:`);
                console.log(tables);

                const requiredTables = ['DailySchedules', 'EnergyLogs'];
                const missingTables = requiredTables.filter(table => !tables.map(t => t.toString().toLowerCase()).includes(table.toLowerCase()));

                if (missingTables.length > 0) {
                    console.log(`\n⚠️ Missing required tables: ${missingTables.join(', ')}`);
                    console.log('Run "npm run migration:up" to create these tables.');
                } else {
                    console.log('\n✅ All required tables are present in the database.');
                }
                break;
        }
    } catch (error) {
        console.error('Error running migrations:', error);
        console.error(error.stack);
        process.exit(1);
    } finally {
        // Only close the connection if this script was run directly
        if (process.argv[1] === fileURLToPath(import.meta.url)) {
            console.log('Closing database connection...');
            await db.sequelize.close();
            console.log('Database connection closed.');
        } else {
            console.log('Keeping database connection open for continued use.');
        }
    }
}

// Export the function for use by other modules
export default async function (command = 'status') {
    console.log(`Default export function called with command: ${command}`);
    // If called directly from command line
    if (process.argv[1] === fileURLToPath(import.meta.url)) {
        console.log('Running migrations from command line');
        await runMigrations();
    } else {
        // Called as an import
        console.log('Running migrations from import');
        await runMigrations(command);
    }
    console.log('Migration run completed');
} 