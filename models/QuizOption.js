const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const QuizQuestion = require('./QuizQuestion');

const QuizOption = sequelize.define('QuizOption', {
    id: {
        type: DataTypes.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true
    },
    quiz_question_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        references: {
            model: QuizQuestion,
            key: 'id'
        }
    },
    label: {
        type: DataTypes.STRING, // A, B, C, D
        allowNull: false
    },
    text: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    is_correct: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    tableName: 'quiz_options',
    timestamps: true,
    underscored: true
});

module.exports = QuizOption;
