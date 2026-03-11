const { Product, ProductMessage, User } = require('../models');

// List active products
exports.list = async (req, res) => {
    try {
        const products = await Product.findAll({
            where: { is_active: true },
            order: [['created_at', 'DESC']]
        });
        res.json(products);
    } catch (error) {
        console.error('Product list error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// Product detail page
exports.show = async (req, res) => {
    try {
        const product = await Product.findOne({
            where: { id: req.params.id, is_active: true }
        });
        if (!product) {
            return res.status(404).send('Produk tidak ditemukan');
        }

        const messages = await ProductMessage.findAll({
            where: { product_id: product.id },
            include: [{ model: User, attributes: ['id', 'name', 'avatar'] }],
            order: [['created_at', 'DESC']],
            limit: 50
        });

        res.render('product-detail', {
            product,
            messages,
            user: req.session.user || null
        });
    } catch (error) {
        console.error('Product show error:', error);
        res.status(500).send('Internal Server Error');
    }
};

// Send product message
exports.sendMessage = async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ success: false, message: 'Silakan login terlebih dahulu' });
    }

    const { product_id, message } = req.body;
    if (!product_id || !message) {
        return res.status(400).json({ success: false, message: 'Product ID dan pesan wajib diisi' });
    }

    try {
        await ProductMessage.create({
            user_id: req.session.user.id,
            product_id,
            message,
        });
        res.json({ success: true, message: 'Pesan berhasil dikirim. Admin akan segera membalas.' });
    } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({ success: false, message: 'Gagal mengirim pesan' });
    }
};
