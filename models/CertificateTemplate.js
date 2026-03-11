const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CertificateTemplate = sequelize.define('CertificateTemplate', {
    name: { type: DataTypes.STRING, allowNull: false },
    background_image: { type: DataTypes.STRING },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
}, {
    tableName: 'certificate_templates',
    timestamps: true,
    underscored: true,
});

module.exports = CertificateTemplate;
