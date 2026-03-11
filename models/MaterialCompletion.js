const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');
const Material = require('./Material');

const MaterialCompletion = sequelize.define('MaterialCompletion', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    user_id: {
        type: DataTypes.BIGINT,
        allowNull: false
    },
    material_id: {
        type: DataTypes.BIGINT,
        allowNull: false
    },
    completed_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'material_completions',
    timestamps: false,
    underscored: true
});

User.belongsToMany(Material, { through: MaterialCompletion, foreignKey: 'user_id', as: 'completed_materials', constraints: false });
Material.belongsToMany(User, { through: MaterialCompletion, foreignKey: 'material_id', as: 'completed_by_users', constraints: false });

module.exports = MaterialCompletion;
