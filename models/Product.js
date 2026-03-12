const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Product = sequelize.define('Product', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    name: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT },
    price: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
    image: { type: DataTypes.STRING },
    rating: { type: DataTypes.DECIMAL(3, 2), defaultValue: 0 },
    sold_count: { type: DataTypes.INTEGER, defaultValue: 0 },
    link: { type: DataTypes.STRING },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
}, {
    tableName: 'products',
    timestamps: true,
    underscored: true,
});

module.exports = Product;
