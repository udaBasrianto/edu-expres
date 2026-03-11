const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');
const Course = require('./Course');

const CourseUser = sequelize.define('CourseUser', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    user_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
            model: User,
            key: 'id'
        }
    },
    course_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
            model: Course,
            key: 'id'
        }
    },
    status: {
        type: DataTypes.STRING,
        defaultValue: 'active'
    }
}, {
    tableName: 'course_user',
    timestamps: true,
    underscored: true
});

module.exports = CourseUser;
