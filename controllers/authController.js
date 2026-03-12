const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { Order, OrderItem, Product, Course } = require('../models');

exports.loginPage = (req, res) => {
    if (req.session.user) {
        return res.redirect('/');
    }
    res.redirect('/?tab=login');
};

exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ where: { email } });

        if (!user) {
            return res.status(401).json({ success: false, message: 'Email tidak ditemukan' });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Password salah' });
        }

        req.session.user = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            balance: user.balance,
            avatar: user.avatar,
            nip: user.nip
        };

        res.json({ success: true, message: 'Login berhasil', redirect: '/?tab=home' });

    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
    }
};

exports.logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Logout gagal' });
        }
        res.json({ success: true, redirect: '/?tab=login' });
    });
};

exports.registerPage = (req, res) => {
    if (req.session.user) {
        return res.redirect('/');
    }
    res.redirect('/?tab=signup');
};

exports.register = async (req, res) => {
    try {
        const { name, email, password, confirm_password } = req.body;
        if (!name || !email || !password || !confirm_password) {
            return res.status(400).json({ success: false, message: 'Semua field wajib diisi' });
        }
        if (password.length < 6) {
            return res.status(400).json({ success: false, message: 'Password minimal 6 karakter' });
        }
        if (password !== confirm_password) {
            return res.status(400).json({ success: false, message: 'Konfirmasi password tidak cocok' });
        }
        const existing = await User.findOne({ where: { email } });
        if (existing) {
            return res.status(409).json({ success: false, message: 'Email sudah terdaftar' });
        }
        const hashed = await bcrypt.hash(password, 10);
        const user = await User.create({
            name,
            email,
            password: hashed,
            role: 'student'
        });
        req.session.user = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            balance: user.balance,
            avatar: user.avatar,
            nip: user.nip
        };
        res.json({ success: true, message: 'Registrasi berhasil', redirect: '/?tab=home' });
    } catch (error) {
        console.error('Register Error:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
    }
};

exports.updateProfile = async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { name, email, current_password, new_password } = req.body;
    const userId = req.session.user.id;

    try {
        const user = await User.findByPk(userId);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Verify current password if changing sensitive info or just validation
        // For simplicity, we require password only if changing password

        if (new_password) {
            if (!current_password) {
                return res.status(400).json({ success: false, message: 'Password saat ini diperlukan untuk mengubah password' });
            }
            const isMatch = await bcrypt.compare(current_password, user.password);
            if (!isMatch) {
                return res.status(400).json({ success: false, message: 'Password saat ini salah' });
            }
            user.password = await bcrypt.hash(new_password, 10);
        }

        user.name = name;
        if (email) {
            user.email = email;
        }

        await user.save();

        // Update session
        req.session.user.name = user.name;
        req.session.user.email = user.email;

        res.json({ success: true, message: 'Profil berhasil diperbarui', user: req.session.user });

    } catch (error) {
        console.error('Update Profile Error:', error);
        res.status(500).json({ success: false, message: 'Gagal memperbarui profil' });
    }
};

exports.profileOrders = async (req, res) => {
    try {
        const orders = await Order.findAll({
            where: { user_id: req.session.user.id },
            include: [{ model: OrderItem, as: 'items', include: [{ model: Product }, { model: Course }] }],
            order: [['created_at', 'DESC']]
        });
        res.json({ success: true, orders });
    } catch (error) {
        console.error('Profile Orders Error:', error);
        res.json({ success: false, orders: [] });
    }
};

exports.profileChats = async (req, res) => {
    try {
        res.json({ success: true, chats: [] });
    } catch (error) {
        console.error('Profile Chats Error:', error);
        res.json({ success: false, chats: [] });
    }
};

// Admin Register Page
exports.adminRegisterPage = (req, res) => {
    res.render('admin-register');
};

// Admin Register POST
exports.adminRegister = async (req, res) => {
    const { name, email, password, password_confirmation } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ success: false, message: 'Semua field wajib diisi' });
    }
    if (password.length < 12) {
        return res.status(400).json({ success: false, message: 'Password minimal 12 karakter' });
    }
    if (password !== password_confirmation) {
        return res.status(400).json({ success: false, message: 'Password dan konfirmasi tidak cocok' });
    }

    try {
        const existing = await User.findOne({ where: { email } });
        if (existing) {
            return res.status(400).json({ success: false, message: 'Email sudah terdaftar' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await User.create({
            name,
            email,
            password: hashedPassword,
            is_admin: true,
            role: 'admin',
            is_active: true
        });

        res.json({ success: true, message: 'Admin berhasil didaftarkan' });
    } catch (error) {
        console.error('Admin Register Error:', error);
        res.status(500).json({ success: false, message: 'Gagal mendaftarkan admin' });
    }
};

// Update Password
exports.updatePassword = async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { current_password, password, password_confirmation } = req.body;

    if (!current_password || !password) {
        return res.status(400).json({ success: false, message: 'Semua field wajib diisi' });
    }
    if (password.length < 8) {
        return res.status(400).json({ success: false, message: 'Password baru minimal 8 karakter' });
    }
    if (password !== password_confirmation) {
        return res.status(400).json({ success: false, message: 'Password baru dan konfirmasi tidak cocok' });
    }

    try {
        const user = await User.findByPk(req.session.user.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
        }

        const isMatch = await bcrypt.compare(current_password, user.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Password lama tidak benar' });
        }

        user.password = await bcrypt.hash(password, 10);
        await user.save();

        res.json({ success: true, message: 'Password berhasil diubah' });
    } catch (error) {
        console.error('Update Password Error:', error);
        res.status(500).json({ success: false, message: 'Gagal mengubah password' });
    }
};
