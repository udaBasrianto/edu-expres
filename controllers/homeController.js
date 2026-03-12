const Course = require('../models/Course');
const AppSetting = require('../models/AppSetting');

const CourseUser = require('../models/CourseUser');
const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const User = require('../models/User');
const Post = require('../models/Post');
const { Op, fn, col, literal } = require('sequelize');

exports.index = async (req, res) => {

    let appSettings = {
        app_name: 'Edu HSI (Express)',
        logo_path: null,
        theme_color: 'blue'
    };

    try {
        const dbSettings = await AppSetting.findOne({ where: { key: 'default' } });
        if (dbSettings) {
            appSettings = dbSettings;
        }
    } catch (err) {
        console.error('Error fetching app settings:', err);
    }

    const colorMap = {
        'blue': '#1e3a8a', 'green': '#065f46', 'red': '#991b1b', 'purple': '#5b21b6',
        'pink': '#9d174d', 'orange': '#9a3412', 'teal': '#0f766e', 'emerald': '#065f46',
        'cyan': '#155e75', 'indigo': '#3730a3', 'violet': '#5b21b6', 'fuchsia': '#86198f',
        'rose': '#9f1239', 'black': '#111827', 'slate': '#1e293b'
    };
    const primaryColor = colorMap[appSettings.theme_color] || appSettings.theme_color || '#1e3a8a';

    let quizzesJson = [];
    const myAttempts = [];
    let myCourses = [];
    let stats = { courses: 0, quizzes: 0 };
    let leaderboard = [];
    let products = [];
    let quizHistory = [];
    let orderHistory = [];
    let depositHistory = [];

    try {
        quizzesJson = await Quiz.findAll({
            where: { is_active: true }
        });
        stats.quizzes = await Quiz.count({ where: { is_active: true } });
    } catch (error) {
        console.error('Error fetching quizzes:', error);
    }

    if (req.session.user) {
        try {
            const enrollments = await CourseUser.findAll({
                where: { user_id: req.session.user.id },
                include: [{ model: Course }]
            });
            myCourses = enrollments.map(e => e.Course);
        } catch (error) {
            console.error('Error fetching enrollments:', error);
        }

        // Fetch Order History
        try {
            const Order = require('../models/Order');
            const OrderItem = require('../models/OrderItem');
            const Product = require('../models/Product');
            orderHistory = await Order.findAll({
                where: { user_id: req.session.user.id },
                include: [{ 
                    model: OrderItem, 
                    as: 'items',
                    include: [
                        { model: Product },
                        { model: Course }
                    ]
                }],
                order: [['createdAt', 'DESC']]
            });
        } catch (error) {
            console.error('Error fetching order history:', error);
        }

        // Fetch Deposit History
        try {
            const Deposit = require('../models/Deposit');
            const BankAccount = require('../models/BankAccount');
            depositHistory = await Deposit.findAll({
                where: { user_id: req.session.user.id },
                include: [{ model: BankAccount }],
                order: [['createdAt', 'DESC']]
            });
        } catch (error) {
            console.error('Error fetching deposit history:', error);
        }
    }
    try {
        stats.courses = await Course.count();
    } catch (error) {
        console.error('Error fetching course count:', error);
    }
    try {
        const rows = await QuizAttempt.findAll({
            attributes: [
                'user_id',
                [fn('AVG', col('score')), 'avg_score'],
                [fn('COUNT', col('QuizAttempt.id')), 'attempts']
            ],
            include: [{ model: User, attributes: ['id', 'name'] }],
            group: ['user_id'],
            order: [[fn('AVG', col('score')), 'DESC']],
            limit: 10
        });
        leaderboard = rows.map(r => ({
            user_id: r.user_id,
            name: r.User ? r.User.name : 'Pengguna',
            avg_score: Number(r.get('avg_score') || 0),
            attempts: Number(r.get('attempts') || 0)
        }));
        if (!leaderboard || leaderboard.length === 0) {
            const fallback = await QuizAttempt.findAll({
                attributes: ['user_id', 'score'],
                include: [{ model: User, attributes: ['id', 'name'] }],
                order: [['score', 'DESC']],
                limit: 10
            });
            leaderboard = fallback.map(r => ({
                user_id: r.user_id,
                name: r.User ? r.User.name : 'Pengguna',
                avg_score: Number(r.score || 0),
                attempts: 1
            }));
        }
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
    }
    try {
        const paid = await Course.findAll({
            where: { type: 'paid' },
            limit: 6,
            order: [['createdAt', 'DESC']]
        });
        products = paid.map(c => ({
            id: c.id,
            title: c.title,
            short_desc: c.short_desc,
            price: c.price,
            currency: c.currency
        }));
    } catch (error) {
        console.error('Error fetching products:', error);
    }

    // Fetch Blog Posts
    try {
        const posts = await Post.findAll({
            where: { status: 'published' },
            order: [['created_at', 'DESC']],
            limit: 20,
            include: [{ model: require('../models').Category, as: 'category' }]
        });
        blogPosts = posts.map(p => ({
            id: p.id,
            title: p.title,
            slug: p.slug,
            excerpt: p.content ? p.content.replace(/<[^>]*>?/gm, '').substring(0, 100) + '...' : '',
            image: p.image,
            created_at: p.created_at,
            category: p.category ? { name: p.category.name } : null
        }));
    } catch (error) {
        console.error('Error fetching blog posts:', error);
    }

    // Fetch Quiz History for logged in user
    if (req.session.user) {
        try {
            quizHistory = await QuizAttempt.findAll({
                where: { user_id: req.session.user.id },
                include: [{ model: Quiz }],
                order: [['created_at', 'DESC']]
            });
        } catch (error) {
            console.error('Error fetching quiz history:', error);
        }
    }

    res.render('layout', {
        appSettings,
        primaryColor,
        quizzesJson,
        myAttempts,
        myCourses,
        stats,
        leaderboard,
        products,
        blogPosts,
        quizHistory,
        orderHistory,
        depositHistory,
        user: req.session.user || null
    });
};

exports.cartCount = (req, res) => {
    const cart = req.session.cart || [];
    res.json({ count: cart.length });
};

exports.getCartItems = (req, res) => {
    const cart = req.session.cart || [];
    res.json(cart);
};

exports.addToCart = (req, res) => {
    const { courseId, title, price } = req.body;

    if (!req.session.cart) {
        req.session.cart = [];
    }

    const existing = req.session.cart.find(item => item.courseId == courseId);
    if (existing) {
        return res.json({ success: false, message: 'Kursus sudah ada di keranjang' });
    }

    req.session.cart.push({ courseId, title, price });
    res.json({ success: true, count: req.session.cart.length });
};

exports.removeFromCart = (req, res) => {
    const { courseId } = req.body;
    if (req.session.cart) {
        req.session.cart = req.session.cart.filter(item => item.courseId != courseId);
    }
    res.json({ success: true, count: req.session.cart ? req.session.cart.length : 0 });
};

exports.checkout = async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ success: false, message: 'Silakan login terlebih dahulu' });
    }

    const cart = req.session.cart || [];
    if (cart.length === 0) {
        return res.status(400).json({ success: false, message: 'Keranjang kosong' });
    }

    try {
        const userId = req.session.user.id;
        const enrollments = cart.map(item => ({
            user_id: userId,
            course_id: item.courseId,
            status: 'active'
        }));

        await CourseUser.bulkCreate(enrollments, { ignoreDuplicates: true });

        // Clear cart
        req.session.cart = [];

        res.json({ success: true, message: 'Pendaftaran berhasil!' });
    } catch (error) {
        console.error('Checkout error:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan saat proses checkout' });
    }
};

exports.courses = async (req, res) => {
    try {
        const courses = await Course.findAll();

        // Transform data
        const formattedCourses = courses.map(c => ({
            id: c.id,
            title: c.title,
            short_desc: c.short_desc,
            price: c.price,
            currency: c.currency,
            type: c.type,
            color: c.color,
            is_enrolled: false,
            enrollment_status: null
        }));

        res.json(formattedCourses);
    } catch (error) {
        console.error('Error fetching courses:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.courseDetail = async (req, res) => {
    try {
        const course = await Course.findByPk(req.params.id, {
            include: [{ model: Material, as: 'materials', order: [['order', 'ASC']] }]
        });
        if (!course) {
            return res.status(404).json({ error: 'Course not found' });
        }
        res.json(course);
    } catch (error) {
        console.error('Error fetching course detail:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// Leaderboard Load More
exports.leaderboardLoadMore = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const perPage = 10;
    const offset = 13 + ((page - 1) * perPage);

    try {
        const rows = await QuizAttempt.findAll({
            attributes: [
                'user_id',
                [fn('AVG', col('score')), 'avg_score'],
                [fn('COUNT', col('QuizAttempt.id')), 'attempts']
            ],
            include: [{ model: User, attributes: ['id', 'name'] }],
            group: ['user_id'],
            order: [[fn('AVG', col('score')), 'DESC']],
            limit: perPage,
            offset: offset
        });

        const ranks = rows.map((r, index) => ({
            rank: offset + index + 1,
            user_id: r.user_id,
            name: r.User ? r.User.name : 'Pengguna',
            avg_score: Number(r.get('avg_score') || 0),
            attempts: Number(r.get('attempts') || 0)
        }));

        res.json({
            success: true,
            ranks,
            hasMore: rows.length === perPage
        });
    } catch (error) {
        console.error('Leaderboard Load More Error:', error);
        res.json({ success: true, ranks: [], hasMore: false });
    }
};
