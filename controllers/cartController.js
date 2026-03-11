const { CartItem, Product, Course } = require('../models');

// Add to cart (DB-based)
exports.add = async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ success: false, message: 'Silakan login terlebih dahulu' });
    }

    const rawProductId = req.body.product_id ?? req.body.productId;
    const rawCourseId = req.body.courseId ?? req.body.course_id;
    const rawQuantity = req.body.quantity;

    const productId =
        rawProductId === undefined || rawProductId === null || rawProductId === '' || rawProductId === 'undefined'
            ? null
            : Number(rawProductId);
    const courseId =
        rawCourseId === undefined || rawCourseId === null || rawCourseId === '' || rawCourseId === 'undefined'
            ? null
            : Number(rawCourseId);
    const qty = rawQuantity === undefined || rawQuantity === null || rawQuantity === '' ? 1 : Number(rawQuantity);
    
    if ((!productId || Number.isNaN(productId)) && (!courseId || Number.isNaN(courseId))) {
        return res.status(400).json({ success: false, message: 'Invalid item' });
    }

    try {
        const where = { user_id: req.session.user.id };
        if (productId && !Number.isNaN(productId)) where.product_id = productId;
        if (courseId && !Number.isNaN(courseId)) where.course_id = courseId;

        const existing = await CartItem.findOne({ where });

        if (existing) {
            existing.quantity += qty > 0 && !Number.isNaN(qty) ? qty : 1;
            await existing.save();
        } else {
            await CartItem.create({
                user_id: req.session.user.id,
                product_id: productId && !Number.isNaN(productId) ? productId : null,
                course_id: courseId && !Number.isNaN(courseId) ? courseId : null,
                quantity: qty > 0 && !Number.isNaN(qty) ? qty : 1,
            });
        }

        const count = await CartItem.count({ where: { user_id: req.session.user.id } });
        res.json({ success: true, message: 'Item berhasil ditambahkan ke keranjang.', count });
    } catch (error) {
        console.error('Cart add error:', error);
        res.status(500).json({ success: false, message: 'Gagal menambah ke keranjang' });
    }
};

// Remove from cart
exports.remove = async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { id } = req.body;
    try {
        await CartItem.destroy({
            where: { id, user_id: req.session.user.id }
        });
        res.json({ success: true, message: 'Item deleted' });
    } catch (error) {
        console.error('Cart remove error:', error);
        res.status(500).json({ success: false, message: 'Gagal menghapus item' });
    }
};

// Cart count
exports.count = async (req, res) => {
    const count = req.session.user
        ? await CartItem.count({ where: { user_id: req.session.user.id } })
        : 0;
    res.json({ count });
};

// Cart items list
exports.list = async (req, res) => {
    if (!req.session.user) {
        return res.json({ items: [] });
    }

    try {
        const items = await CartItem.findAll({
            where: { user_id: req.session.user.id },
            include: [
                { model: Product },
                { model: Course }
            ]
        });
        res.json({ items });
    } catch (error) {
        console.error('Cart list error:', error);
        res.status(500).json({ items: [] });
    }
};
