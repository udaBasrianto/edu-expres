const { Order, OrderItem, CartItem, Product, Course, User } = require('../models');
const sequelize = require('../config/database');
const path = require('path');

// Checkout
exports.checkout = async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ success: false, message: 'Silakan login terlebih dahulu' });
    }

    const { address, items } = req.body;
    
    // Address is optional now (for digital products)
    // Items can be optional (checkout all cart)

    const t = await sequelize.transaction();
    try {
        const userId = req.session.user.id;
        
        let cartItems;
        if (items && Array.isArray(items) && items.length > 0) {
            const cartItemIds = items.map(i => i.id);
            cartItems = await CartItem.findAll({
                where: { user_id: userId, id: cartItemIds },
                include: [{ model: Product }, { model: Course }],
                transaction: t
            });
        } else {
             cartItems = await CartItem.findAll({
                where: { user_id: userId },
                include: [{ model: Product }, { model: Course }],
                transaction: t
            });
        }

        if (cartItems.length === 0) {
            await t.rollback();
            return res.status(400).json({ success: false, message: 'Keranjang kosong.' });
        }

        let totalAmount = 0;
        const orderItemsData = [];

        for (const item of cartItems) {
            const reqItem = items ? items.find(i => i.id == item.id) : null;
            const qty = reqItem?.quantity || item.quantity;
            const note = reqItem?.note || null;
            
            let price = 0;
            let productId = null;
            let courseId = null;
            let unitPrice = 0;

            if (item.Product) {
                productId = item.Product.id;
                unitPrice = parseFloat(item.Product.price);
                price = unitPrice * qty;
            } else if (item.Course) {
                courseId = item.Course.id;
                unitPrice = parseFloat(item.Course.price);
                price = unitPrice * qty;
            }

            totalAmount += price;

            orderItemsData.push({
                product_id: productId,
                course_id: courseId,
                quantity: qty,
                price: unitPrice,
                note,
            });
        }

        // Create Order
        const order = await Order.create({
            user_id: userId,
            total_amount: totalAmount,
            status: 'pending',
            shipping_address: address || null,
        }, { transaction: t });

        // Create Order Items
        for (const data of orderItemsData) {
            await OrderItem.create({
                order_id: order.id,
                product_id: data.product_id,
                course_id: data.course_id,
                quantity: data.quantity,
                price: data.price,
                note: data.note,
            }, { transaction: t });
        }

        // Clear checked out items from cart
        const processedIds = cartItems.map(i => i.id);
        await CartItem.destroy({
            where: { id: processedIds },
            transaction: t
        });

        await t.commit();
        res.json({
            success: true,
            message: 'Pesanan berhasil dibuat.',
            order_id: order.id,
            total_amount: totalAmount,
        });
    } catch (error) {
        await t.rollback();
        console.error('Checkout error:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan sistem: ' + error.message });
    }
};

// Upload payment proof
exports.uploadPayment = async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { order_id } = req.body;
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'Bukti pembayaran wajib diupload' });
    }

    try {
        const order = await Order.findOne({
            where: { id: order_id, user_id: req.session.user.id }
        });

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order tidak ditemukan' });
        }

        order.payment_proof = 'uploads/' + req.file.filename;
        await order.save();

        res.json({ success: true, message: 'Bukti pembayaran berhasil diupload' });
    } catch (error) {
        console.error('Upload payment error:', error);
        res.status(500).json({ success: false, message: 'Gagal upload bukti pembayaran' });
    }
};

// Pay with balance
exports.payWithBalance = async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { order_id } = req.body;
    const t = await sequelize.transaction();

    try {
        const user = await User.findByPk(req.session.user.id, { transaction: t });
        const order = await Order.findOne({
            where: { id: order_id, user_id: req.session.user.id },
            transaction: t
        });

        if (!order) {
            await t.rollback();
            return res.status(404).json({ success: false, message: 'Order tidak ditemukan' });
        }

        if (order.status !== 'pending') {
            await t.rollback();
            return res.status(400).json({ success: false, message: 'Order ini tidak dalam status pending.' });
        }

        if (parseFloat(user.balance) < parseFloat(order.total_amount)) {
            await t.rollback();
            return res.status(400).json({ success: false, message: 'Saldo tidak mencukupi' });
        }

        // Deduct balance
        user.balance = parseFloat(user.balance) - parseFloat(order.total_amount);
        await user.save({ transaction: t });

        // Update order status
        order.status = 'processing';
        await order.save({ transaction: t });

        await t.commit();

        // Update session balance
        req.session.user.balance = user.balance;

        res.json({ success: true, message: 'Pembayaran berhasil. Pesanan sedang diproses.' });
    } catch (error) {
        await t.rollback();
        console.error('Pay with balance error:', error);
        res.status(500).json({ success: false, message: 'Gagal memproses pembayaran: ' + error.message });
    }
};
