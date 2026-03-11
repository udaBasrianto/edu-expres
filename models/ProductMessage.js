const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ProductMessage = sequelize.define('ProductMessage', {
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    product_id: { type: DataTypes.INTEGER, allowNull: false },
    message: { type: DataTypes.TEXT, allowNull: false },
    is_read: { type: DataTypes.BOOLEAN, defaultValue: false },
}, {
    tableName: 'product_messages',
    timestamps: true,
    underscored: true,
});

module.exports = ProductMessage;
