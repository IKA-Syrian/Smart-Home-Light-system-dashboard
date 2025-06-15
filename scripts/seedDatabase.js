import db from '../src/models/index.js';
import bcrypt from 'bcrypt';

// Sample data for seeding the database
const seedData = {
  users: [
    {
      username: 'admin',
      email: 'admin@iot-project.com',
      password: 'admin123', // Will be hashed manually
      role: 'admin'
    },
    {
      username: 'user1',
      email: 'user1@iot-project.com',
      password: 'user123',
      role: 'user'
    },
    {
      username: 'demo',
      email: 'demo@iot-project.com',
      password: 'demo123',
      role: 'user'
    }
  ],

  rooms: [
    {
      name: 'Living Room',
      user_id: 1 // Admin user
    },
    {
      name: 'Bedroom',
      user_id: 1 // Admin user
    },
    {
      name: 'Kitchen',
      user_id: 1 // Admin user
    }
  ],

  devices: [
    {
      name: 'Living Room LED Controller',
      type: 'light', // Changed from LED_CONTROLLER to match ENUM
      status: 'online',
      user_id: 1, // Admin user
      room_id: 1, // Living Room
      is_on: false,
      brightness: 0
    },
    {
      name: 'Bedroom LED Controller',
      type: 'light', // Changed from LED_CONTROLLER to match ENUM
      status: 'online',
      user_id: 1, // Admin user
      room_id: 2, // Bedroom
      is_on: false,
      brightness: 0
    },
    {
      name: 'Kitchen LED Controller',
      type: 'light', // Changed from LED_CONTROLLER to match ENUM
      status: 'online',
      user_id: 1, // Admin user
      room_id: 3, // Kitchen
      is_on: false,
      brightness: 0
    },
    {
      name: 'PIR Motion Sensor',
      type: 'security_camera', // Changed from MOTION_SENSOR to match ENUM (closest option)
      status: 'online',
      user_id: 1, // Admin user
      room_id: 1, // Living Room (main sensor)
      is_on: true
    }
  ],

  sensors: [
    {
      type: 'motion',
      value: 'false',
      device_id: 4 // PIR Motion Sensor
    },
    {
      type: 'light_intensity',
      value: '250',
      device_id: 1 // Living Room LED Controller
    },
    {
      type: 'light_intensity',
      value: '180',
      device_id: 2 // Bedroom LED Controller
    },
    {
      type: 'light_intensity',
      value: '320',
      device_id: 3 // Kitchen LED Controller
    },
    {
      type: 'temperature',
      value: '23.5',
      device_id: 4 // PIR Motion Sensor (has temp sensor)
    }
  ],

  scenes: [
    {
      name: 'Evening Ambiance',
      user_id: 1, // Admin user
      is_active: true
    },
    {
      name: 'Bright Work Mode',
      user_id: 1, // Admin user
      is_active: true
    },
    {
      name: 'Night Mode',
      user_id: 1, // Admin user
      is_active: true
    },
    {
      name: 'All Off',
      user_id: 1, // Admin user
      is_active: true
    }
  ],

  schedules: [
    {
      user_id: 1, // Admin user
      scene_id: 2, // Bright Work Mode
      cron_expression: '0 7 * * *', // 7:00 AM daily
      action: 'activate_scene',
      is_active: true
    },
    {
      user_id: 1, // Admin user
      scene_id: 1, // Evening Ambiance
      cron_expression: '0 19 * * *', // 7:00 PM daily
      action: 'activate_scene',
      is_active: true
    },
    {
      user_id: 1, // Admin user
      scene_id: 3, // Night Mode
      cron_expression: '0 22 * * *', // 10:00 PM daily
      action: 'activate_scene',
      is_active: true
    },
    {
      user_id: 1, // Admin user
      scene_id: 2, // Bright Work Mode
      cron_expression: '0 9 * * 0,6', // 9:00 AM on weekends
      action: 'activate_scene',
      is_active: true
    }
  ]
};

// Function to seed the database
async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');

    // Check if we should force recreate tables
    const forceRecreate = process.argv.includes('--force');
    
    if (forceRecreate) {
      console.log('🔄 Force recreating database tables...');
      await db.sequelize.sync({ force: true });
    } else {
      // Sync database (create tables if they don't exist)
      await db.sequelize.sync({ alter: true });
    }

    console.log('📋 Database synchronized successfully');

    // Clear existing data if force recreate
    if (forceRecreate) {
      console.log('🧹 Clearing existing data...');
    }

    // Seed Users
    console.log('👥 Seeding users...');
    const users = [];
    for (const userData of seedData.users) {
      try {
        const existingUser = await db.User.findOne({ where: { email: userData.email } });
        if (!existingUser) {
          // Hash password manually
          const salt = await bcrypt.genSalt(10);
          const password_hash = await bcrypt.hash(userData.password, salt);
          
          const user = await db.User.create({
            username: userData.username,
            email: userData.email,
            password_hash: password_hash,
            role: userData.role
          });
          users.push(user);
        } else {
          users.push(existingUser);
        }
      } catch (error) {
        console.log(`⚠️  User ${userData.email} already exists or failed to create:`, error.message);
      }
    }
    console.log(`✅ Created ${users.length} users`);

    // Seed Rooms
    console.log('🏠 Seeding rooms...');
    const rooms = await db.Room.bulkCreate(seedData.rooms, {
      ignoreDuplicates: true
    });
    console.log(`✅ Created ${rooms.length} rooms`);

    // Seed Devices
    console.log('🔌 Seeding devices...');
    const devices = await db.Device.bulkCreate(seedData.devices, {
      ignoreDuplicates: true
    });
    console.log(`✅ Created ${devices.length} devices`);

    // Seed Sensors
    console.log('📡 Seeding sensors...');
    const sensors = await db.Sensor.bulkCreate(seedData.sensors, {
      ignoreDuplicates: true
    });
    console.log(`✅ Created ${sensors.length} sensors`);

    // Seed Scenes
    console.log('🎬 Seeding scenes...');
    const scenes = await db.Scene.bulkCreate(seedData.scenes, {
      ignoreDuplicates: true
    });
    console.log(`✅ Created ${scenes.length} scenes`);

    // Seed Schedules
    console.log('⏰ Seeding schedules...');
    const schedules = await db.Schedule.bulkCreate(seedData.schedules, {
      ignoreDuplicates: true
    });
    console.log(`✅ Created ${schedules.length} schedules`);

    // Create some sample event logs
    console.log('📝 Creating sample event logs...');
    const sampleEvents = [
      {
        event_type: 'device_status_change',
        description: 'Living Room LED Controller came online',
        user_id: 1,
        device_id: 1
      },
      {
        event_type: 'motion_detected',
        description: 'Motion detected in Living Room',
        user_id: 1,
        device_id: 4,
        sensor_id: 1
      },
      {
        event_type: 'scene_activated',
        description: 'Evening Ambiance scene activated',
        user_id: 1
      },
      {
        event_type: 'device_control',
        description: 'Bedroom LED brightness set to 75%',
        user_id: 1,
        device_id: 2
      },
      {
        event_type: 'system_startup',
        description: 'IoT system started successfully',
        user_id: 1
      }
    ];

    const eventLogs = await db.EventLog.bulkCreate(sampleEvents, {
      ignoreDuplicates: true
    });
    console.log(`✅ Created ${eventLogs.length} event logs`);

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   • ${users.length} Users created`);
    console.log(`   • ${rooms.length} Rooms created`);
    console.log(`   • ${devices.length} Devices created (3 LED controllers + 1 PIR sensor)`);
    console.log(`   • ${sensors.length} Sensors created`);
    console.log(`   • ${scenes.length} Scenes created`);
    console.log(`   • ${schedules.length} Schedules created`);
    console.log(`   • ${eventLogs.length} Event logs created`);

    console.log('\n🔑 Test Credentials:');
    console.log('   • Admin: admin@iot-project.com / admin123');
    console.log('   • User: user1@iot-project.com / user123');
    console.log('   • Demo: demo@iot-project.com / demo123');

    console.log('\n💡 LED Simulation Setup:');
    console.log('   • LED 0: Living Room (Device ID: 1)');
    console.log('   • LED 1: Bedroom (Device ID: 2)');
    console.log('   • LED 2: Kitchen (Device ID: 3)');
    console.log('   • PIR Sensor: Living Room (Device ID: 4)');

    console.log('\n🚀 Ready to start the server!');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    await db.sequelize.close();
    process.exit(0);
  }
}

// Run the seeding
seedDatabase(); 