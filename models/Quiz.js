const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Quiz = sequelize.define('Quiz', {
    id: {
        type: DataTypes.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    duration_minutes: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    certificate_template_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true
    },
    certificate_threshold: {
        type: DataTypes.INTEGER,
        allowNull: true
    }
}, {
    tableName: 'quizzes',
    timestamps: true,
    underscored: true
});

module.exports = Quiz;
