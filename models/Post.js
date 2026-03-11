const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Post = sequelize.define('Post', {
    title: { type: DataTypes.STRING, allowNull: false },
    slug: { type: DataTypes.STRING, unique: true },
    type: { type: DataTypes.STRING, defaultValue: 'article' },
    content: { type: DataTypes.TEXT },
    image: { type: DataTypes.STRING },
    category_id: { type: DataTypes.INTEGER },
    status: { type: DataTypes.STRING, defaultValue: 'draft' },
    order: { type: DataTypes.INTEGER, defaultValue: 0 },
}, {
    tableName: 'posts',
    timestamps: true,
    underscored: true,
});

module.exports = Post;
