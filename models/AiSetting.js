const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AiSetting = sequelize.define('AiSetting', {
    provider: { type: DataTypes.STRING, allowNull: false },
    api_key: { type: DataTypes.TEXT },
    models: { type: DataTypes.JSON },
    selected_model: { type: DataTypes.STRING },
    system_prompt: { type: DataTypes.TEXT },
    reference_url: { type: DataTypes.STRING },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
}, {
    tableName: 'ai_settings',
    timestamps: true,
    underscored: true,
});

module.exports = AiSetting;
