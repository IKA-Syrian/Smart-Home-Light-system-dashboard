import Sequelize from 'sequelize';
import sequelizeInstance from '../config/db.js';

// Import model definitions
import UserModel from './user.js';
import RoomModel from './room.js';
import DeviceModel from './device.js';
import SensorModel from './sensor.js';
import ScheduleModel from './schedule.js';
import SceneModel from './scene.js';
import EventLogModel from './eventLog.js';
import DailyScheduleModel from './dailySchedule.js';
import EnergyLogModel from './energyLog.js';

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelizeInstance;

// Performance optimization: Initialize models in parallel
const modelInitializers = [
    () => (db.User = UserModel(sequelizeInstance, Sequelize.DataTypes)),
    () => (db.Room = RoomModel(sequelizeInstance, Sequelize.DataTypes)),
    () => (db.Device = DeviceModel(sequelizeInstance, Sequelize.DataTypes)),
    () => (db.Sensor = SensorModel(sequelizeInstance, Sequelize.DataTypes)),
    () => (db.Schedule = ScheduleModel(sequelizeInstance, Sequelize.DataTypes)),
    () => (db.Scene = SceneModel(sequelizeInstance, Sequelize.DataTypes)),
    () => (db.EventLog = EventLogModel(sequelizeInstance, Sequelize.DataTypes)),
    () => (db.DailySchedule = DailyScheduleModel(sequelizeInstance)),
    () => (db.EnergyLog = EnergyLogModel(sequelizeInstance))
];

// Initialize all models
modelInitializers.forEach(init => init());

// Define associations
// User associations
db.User.hasMany(db.Room, { foreignKey: 'user_id', onDelete: 'CASCADE' });
db.User.hasMany(db.Device, { foreignKey: 'user_id', onDelete: 'CASCADE' });
db.User.hasMany(db.Schedule, { foreignKey: 'user_id', onDelete: 'CASCADE' });
db.User.hasMany(db.Scene, { foreignKey: 'user_id', onDelete: 'CASCADE' });
db.User.hasMany(db.EventLog, { foreignKey: 'user_id', onDelete: 'SET NULL', allowNull: true });
db.User.hasMany(db.DailySchedule, { foreignKey: 'user_id', onDelete: 'CASCADE' });
db.User.hasMany(db.EnergyLog, { foreignKey: 'user_id', onDelete: 'CASCADE' });

// Room associations
db.Room.belongsTo(db.User, { foreignKey: 'user_id' });
db.Room.hasMany(db.Device, { foreignKey: 'room_id', onDelete: 'SET NULL', allowNull: true });

// Device associations
db.Device.belongsTo(db.User, { foreignKey: 'user_id' });
db.Device.belongsTo(db.Room, { foreignKey: 'room_id', allowNull: true });
db.Device.hasMany(db.Sensor, { foreignKey: 'device_id', onDelete: 'CASCADE' });
db.Device.hasMany(db.Schedule, { foreignKey: 'device_id', onDelete: 'CASCADE' });
db.Device.hasMany(db.EventLog, { foreignKey: 'device_id', onDelete: 'SET NULL', allowNull: true });
db.Device.hasMany(db.DailySchedule, { foreignKey: 'device_id', onDelete: 'CASCADE' });
db.Device.hasMany(db.EnergyLog, { foreignKey: 'device_id', onDelete: 'CASCADE' });

// Sensor associations
db.Sensor.belongsTo(db.Device, { foreignKey: 'device_id' });
db.Sensor.hasMany(db.EventLog, { foreignKey: 'sensor_id', onDelete: 'SET NULL', allowNull: true });

// Schedule associations
db.Schedule.belongsTo(db.User, { foreignKey: 'user_id' });
db.Schedule.belongsTo(db.Device, { foreignKey: 'device_id', allowNull: true });
db.Schedule.belongsTo(db.Scene, { foreignKey: 'scene_id', allowNull: true });

// Scene associations
db.Scene.belongsTo(db.User, { foreignKey: 'user_id' });
db.Scene.hasMany(db.Schedule, { foreignKey: 'scene_id', onDelete: 'CASCADE' });

// Daily Schedule associations
db.DailySchedule.belongsTo(db.User, { foreignKey: 'user_id' });
db.DailySchedule.belongsTo(db.Device, { foreignKey: 'device_id' });

// Energy Log associations
db.EnergyLog.belongsTo(db.User, { foreignKey: 'user_id' });
db.EnergyLog.belongsTo(db.Device, { foreignKey: 'device_id' });

// Scene_Device_Settings (Junction Table Model)
const SceneDeviceSetting = sequelizeInstance.define('Scene_Device_Settings', {
    scene_device_setting_id: {
        type: Sequelize.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    is_on: {
        type: Sequelize.DataTypes.BOOLEAN,
        allowNull: false
    },
    brightness: {
        type: Sequelize.DataTypes.TINYINT.UNSIGNED,
        allowNull: true
    },
    color_hex: {
        type: Sequelize.DataTypes.STRING(7),
        allowNull: true
    }
}, { timestamps: false }); // No createdAt/updatedAt for this junction table

db.Scene.belongsToMany(db.Device, { through: SceneDeviceSetting, foreignKey: 'scene_id', onDelete: 'CASCADE' });
db.Device.belongsToMany(db.Scene, { through: SceneDeviceSetting, foreignKey: 'device_id', onDelete: 'CASCADE' });
db.SceneDeviceSetting = SceneDeviceSetting; // Add to db object

// EventLog associations
db.EventLog.belongsTo(db.User, { foreignKey: 'user_id', allowNull: true });
db.EventLog.belongsTo(db.Device, { foreignKey: 'device_id', allowNull: true });
db.EventLog.belongsTo(db.Sensor, { foreignKey: 'sensor_id', allowNull: true });

export default db;
