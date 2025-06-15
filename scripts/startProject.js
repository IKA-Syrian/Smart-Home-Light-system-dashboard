#!/usr/bin/env node

import { spawn } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';

console.log('🚀 IoT Project Startup Script');
console.log('==============================\n');

// Function to run a command and return a promise
function runCommand(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    console.log(`📦 Running: ${command} ${args.join(' ')}`);
    
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      ...options
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve(code);
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });

    child.on('error', (error) => {
      reject(error);
    });
  });
}

// Main startup function
async function startProject() {
  try {
    console.log('🔍 Checking project structure...');
    
    // Check if necessary files exist
    const requiredFiles = [
      'package.json',
      'src/models/index.js',
      'scripts/seedDatabase.js'
    ];

    for (const file of requiredFiles) {
      if (!existsSync(file)) {
        throw new Error(`Required file not found: ${file}`);
      }
    }

    console.log('✅ Project structure verified\n');

    // Check if node_modules exists
    if (!existsSync('node_modules')) {
      console.log('📦 Installing dependencies...');
      await runCommand('npm', ['install']);
      console.log('✅ Dependencies installed\n');
    }

    // Ask user if they want to seed the database
    const args = process.argv.slice(2);
    const forceSeed = args.includes('--force') || args.includes('-f');
    const skipSeed = args.includes('--skip-seed') || args.includes('-s');

    if (!skipSeed) {
      console.log('🌱 Seeding database with sample data...');
      try {
        const seedArgs = forceSeed ? ['--force'] : [];
        await runCommand('node', ['scripts/seedDatabase.js', ...seedArgs]);
        console.log('✅ Database seeded successfully\n');
      } catch (error) {
        console.log('⚠️  Database seeding failed, but continuing...');
        console.log('   You can run "npm run seed" manually later\n');
      }
    } else {
      console.log('⏭️  Skipping database seeding\n');
    }

    console.log('🚀 Starting IoT Server...');
    console.log('=======================');
    console.log('📡 API will be available at: http://localhost:3000');
    console.log('📚 Swagger docs at: http://localhost:3000/api-docs');
    console.log('🤖 Arduino dashboard at: http://localhost:3000/arduino (frontend)');
    console.log('🔌 WebSocket at: ws://localhost:3000');
    console.log('\n⚠️  Make sure your Arduino is connected to the specified port!');
    console.log('   Set ARDUINO_PORT in .env file or it will default to COM3\n');

    // Start the server
    await runCommand('node', ['index.js']);

  } catch (error) {
    console.error('❌ Startup failed:', error.message);
    
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Make sure you have Node.js installed');
    console.log('   2. Check that all dependencies are installed: npm install');
    console.log('   3. Verify your database connection settings in .env');
    console.log('   4. Check Arduino connection and port settings');
    console.log('   5. Run "npm run seed" to populate sample data');
    
    process.exit(1);
  }
}

// Handle SIGINT for graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n🛑 Gracefully shutting down...');
  console.log('Thanks for using the IoT Project! 👋');
  process.exit(0);
});

// Start the project
startProject(); 