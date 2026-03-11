const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Order = sequelize.define('Order', {
    id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    total_amount: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
    status: { type: DataTypes.STRING, defaultValue: 'pending' },
    payment_proof: { type: DataTypes.STRING },
    shipping_address: { type: DataTypes.TEXT, allowNull: true },
    admin_note: { type: DataTypes.TEXT },
}, {
    tableName: 'orders',
    timestamps: true,
    underscored: true,
});

module.exports = Order;
