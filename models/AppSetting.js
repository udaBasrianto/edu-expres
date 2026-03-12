const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AppSetting = sequelize.define('AppSetting', {
    id: {
        type: DataTypes.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true
    },
    key: { type: DataTypes.STRING, defaultValue: 'default' },
    app_name: { type: DataTypes.STRING, defaultValue: 'HSI Edu' },
    app_slogan: { type: DataTypes.STRING },
    logo_path: { type: DataTypes.STRING },
    favicon_path: { type: DataTypes.STRING },
    theme_color: { type: DataTypes.STRING, defaultValue: 'blue' },
    font_family: { type: DataTypes.STRING },
    slider_config: { type: DataTypes.JSON },
    home_config: { type: DataTypes.JSON },
    menu_config: { type: DataTypes.JSON },
    blog_title: { type: DataTypes.STRING },
    blog_config: { type: DataTypes.JSON },
    academy_slogan: { type: DataTypes.STRING },
    academy_title: { type: DataTypes.STRING },
    regular_title: { type: DataTypes.STRING },
    regular_slogan: { type: DataTypes.STRING },
    payment_config: { type: DataTypes.JSON },
    google_login_enabled: { type: DataTypes.BOOLEAN, defaultValue: false },
    google_client_id: { type: DataTypes.STRING },
    google_client_secret: { type: DataTypes.STRING },
    login_header_text: { type: DataTypes.STRING },
}, {
    tableName: 'app_settings',
    timestamps: true,
    underscored: true,
});

module.exports = AppSetting;
