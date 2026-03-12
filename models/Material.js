const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Course = require('./Course');
const Quiz = require('./Quiz');

const Material = sequelize.define('Material', {
    id: {
        type: DataTypes.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true
    },
    course_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        references: {
            model: Course,
            key: 'id'
        }
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    duration: {
        type: DataTypes.STRING,
        allowNull: true
    },
    type: {
        type: DataTypes.STRING, // video, pdf, quiz, etc.
        defaultValue: 'video'
    },
    link: {
        type: DataTypes.TEXT, // external link if any
        allowNull: true
    },
    media_url: {
        type: DataTypes.TEXT, // internal/hosted file url
        allowNull: true
    },
    quiz_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
        references: {
            model: 'quizzes',
            key: 'id'
        }
    },
    order: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    timer_seconds: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    }
}, {
    tableName: 'materials',
    timestamps: true,
    underscored: true
});

module.exports = Material;
