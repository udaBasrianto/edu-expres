const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const OrderItem = sequelize.define('OrderItem', {
    order_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    product_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    course_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    quantity: { type: DataTypes.INTEGER, defaultValue: 1 },
    price: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
    note: { type: DataTypes.TEXT },
}, {
    tableName: 'order_items',
    timestamps: true,
    underscored: true,
});

module.exports = OrderItem;
