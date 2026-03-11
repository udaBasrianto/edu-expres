const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Quiz = require('./Quiz');

const QuizQuestion = sequelize.define('QuizQuestion', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    quiz_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
            model: Quiz,
            key: 'id'
        }
    },
    question_text: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    order: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    }
}, {
    tableName: 'quiz_questions',
    timestamps: true,
    underscored: true
});

module.exports = QuizQuestion;
