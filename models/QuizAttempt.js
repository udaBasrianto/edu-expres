const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');
const Quiz = require('./Quiz');

const QuizAttempt = sequelize.define('QuizAttempt', {
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
    quiz_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
            model: Quiz,
            key: 'id'
        }
    },
    score: {
        type: DataTypes.FLOAT,
        defaultValue: 0
    },
    correct_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    total_questions: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    completed_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'quiz_attempts',
    timestamps: true,
    underscored: true
});

module.exports = QuizAttempt;
