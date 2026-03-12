const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Deposit = sequelize.define('Deposit', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    user_id: { type: DataTypes.BIGINT, allowNull: false },
    bank_account_id: { type: DataTypes.BIGINT },
    amount: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
    status: { type: DataTypes.STRING, defaultValue: 'pending' },
    proof_image: { type: DataTypes.STRING },
    admin_note: { type: DataTypes.TEXT },
}, {
    tableName: 'deposits',
    timestamps: true,
    underscored: true,
});

module.exports = Deposit;
