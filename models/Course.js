const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Course = sequelize.define('Course', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    slug: {
        type: DataTypes.STRING,
        allowNull: false
    },
    short_desc: {
        type: DataTypes.STRING,
        allowNull: false
    },
    price: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0
    },
    type: {
        type: DataTypes.ENUM('free', 'paid'),
        defaultValue: 'free'
    },
    color: {
        type: DataTypes.STRING,
        defaultValue: 'blue'
    },
    currency: {
        type: DataTypes.STRING,
        defaultValue: 'IDR'
    }
}, {
    tableName: 'courses',
    timestamps: true,
    underscored: true
});

module.exports = Course;