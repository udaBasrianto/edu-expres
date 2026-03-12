const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const OrderItem = sequelize.define('OrderItem', {
    id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    order_id: { type: DataTypes.BIGINT, allowNull: false },
    product_id: { type: DataTypes.BIGINT, allowNull: true },
    course_id: { type: DataTypes.BIGINT, allowNull: true },
    quantity: { type: DataTypes.INTEGER, defaultValue: 1 },
    price: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
    note: { type: DataTypes.TEXT },
}, {
    tableName: 'order_items',
    timestamps: true,
    underscored: true,
});

module.exports = OrderItem;
