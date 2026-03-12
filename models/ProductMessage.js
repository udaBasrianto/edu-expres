const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ProductMessage = sequelize.define('ProductMessage', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    user_id: { type: DataTypes.BIGINT, allowNull: false },
    product_id: { type: DataTypes.BIGINT, allowNull: false },
    message: { type: DataTypes.TEXT, allowNull: false },
    is_read: { type: DataTypes.BOOLEAN, defaultValue: false },
}, {
    tableName: 'product_messages',
    timestamps: true,
    underscored: true,
});

module.exports = ProductMessage;
