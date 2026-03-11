const { Banner } = require('../models');
const fs = require('fs');
const path = require('path');

// Show banner by slug
exports.show = async (req, res) => {
    try {
        const banner = await Banner.findOne({
            where: { slug: req.params.slug, is_active: true }
        });
        if (!banner) {
            return res.status(404).send('Banner tidak ditemukan');
        }
        res.render('post-detail', {
            post: banner, // Reuse post template
            user: req.session.user || null
        });
    } catch (error) {
        console.error('Banner show error:', error);
        res.status(500).send('Internal Server Error');
    }
};

// Store banner (admin)
exports.store = async (req, res) => {
    const { title, subtitle, content, order: sortOrder } = req.body;
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.random().toString(36).substring(2, 7);

    try {
        await Banner.create({
            title,
            slug,
            subtitle,
            content,
            image: req.file ? req.file.filename : null,
            is_active: true,
            order: sortOrder || 1,
        });
        res.redirect('/admin/banners');
    } catch (error) {
        console.error('Banner store error:', error);
        res.redirect('/admin/banners');
    }
};

// Delete banner (admin)
exports.destroy = async (req, res) => {
    try {
        const banner = await Banner.findByPk(req.params.id);
        if (banner) {
            if (banner.image) {
                const filePath = path.join(__dirname, '..', 'public', 'uploads', banner.image);
                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            }
            await banner.destroy();
        }
        res.redirect('/admin/banners');
    } catch (error) {
        console.error('Banner destroy error:', error);
        res.redirect('/admin/banners');
    }
};

// List banners (API)
exports.list = async (req, res) => {
    try {
        const banners = await Banner.findAll({
            where: { is_active: true },
            order: [['order', 'ASC']]
        });
        res.json(banners);
    } catch (error) {
        console.error('Banner list error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
