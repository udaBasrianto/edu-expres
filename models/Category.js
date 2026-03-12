const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Category = sequelize.define('Category', {
    id: {
        type: DataTypes.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true
    },
    name: { type: DataTypes.STRING, allowNull: false },
    slug: { type: DataTypes.STRING, unique: true },
    color: { type: DataTypes.STRING, defaultValue: '#3B82F6' },
}, {
    tableName: 'categories',
    timestamps: true,
    underscored: true,
});

module.exports = Category;
