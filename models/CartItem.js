const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CartItem = sequelize.define('CartItem', {
    id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.BIGINT, allowNull: false },
    product_id: { type: DataTypes.BIGINT, allowNull: true },
    course_id: { type: DataTypes.BIGINT, allowNull: true },
    quantity: { type: DataTypes.INTEGER, defaultValue: 1 },
    note: { type: DataTypes.TEXT },
}, {
    tableName: 'cart_items',
    timestamps: true,
    underscored: true,
});

module.exports = CartItem;
