const {
    User, Course, Material, CourseUser, Quiz, QuizQuestion, QuizOption, QuizAttempt,
    Product, Category, Post, Banner, Order, OrderItem, Deposit, BankAccount,
    AiSetting, AppSetting, ProductMessage
} = require('../models');
const { Op, fn, col } = require('sequelize');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// ═══════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════
exports.dashboard = async (req, res) => {
    try {
        const totalUsers = await User.count();
        const totalCourses = await Course.count();
        const totalQuizzes = await Quiz.count();
        const totalProducts = await Product.count().catch(() => 0);
        const totalOrders = await Order.count().catch(() => 0);
        const totalPosts = await Post.count().catch(() => 0);
        const pendingDeposits = await Deposit.count({ where: { status: 'pending' } }).catch(() => 0);
        const pendingOrders = await Order.count({ where: { status: 'pending' } }).catch(() => 0);

        const recentUsers = await User.findAll({
            order: [['created_at', 'DESC']], limit: 5,
            attributes: ['id', 'name', 'email', 'role', 'created_at']
        });

        const recentAttempts = await QuizAttempt.findAll({
            include: [
                { model: User, attributes: ['name'] },
                { model: Quiz, attributes: ['title'] }
            ],
            order: [['created_at', 'DESC']], limit: 10
        });

        // Score distribution
        const scoreDistribution = [0, 0, 0, 0, 0];
        const allAttempts = await QuizAttempt.findAll({ attributes: ['score'] });
        allAttempts.forEach(a => {
            const s = Number(a.score);
            if (s < 20) scoreDistribution[0]++;
            else if (s < 40) scoreDistribution[1]++;
            else if (s < 60) scoreDistribution[2]++;
            else if (s < 80) scoreDistribution[3]++;
            else scoreDistribution[4]++;
        });

        res.render('admin/dashboard', {
            title: 'Dashboard',
            user: req.session.user,
            stats: { totalUsers, totalCourses, totalQuizzes, totalProducts, totalOrders, totalPosts, pendingDeposits, pendingOrders },
            recentUsers,
            recentAttempts,
            scoreDistribution
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        res.render('admin/dashboard', {
            title: 'Dashboard',
            user: req.session.user,
            stats: { totalUsers: 0, totalCourses: 0, totalQuizzes: 0, totalProducts: 0, totalOrders: 0, totalPosts: 0, pendingDeposits: 0, pendingOrders: 0 },
            recentUsers: [], recentAttempts: [], scoreDistribution: [0, 0, 0, 0, 0]
        });
    }
};

// ═══════════════════════════════════════
// USERS CRUD
// ═══════════════════════════════════════
exports.usersPage = async (req, res) => {
    try {
        const users = await User.findAll({ order: [['created_at', 'DESC']] });
        res.render('admin/users', { title: 'Users', user: req.session.user, users });
    } catch (error) {
        console.error('Users page error:', error);
        res.render('admin/users', { title: 'Users', user: req.session.user, users: [] });
    }
};

exports.createUser = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        const hashed = await bcrypt.hash(password, 10);
        await User.create({ name, email, password: hashed, role: role || 'student' });
        res.redirect('/admin/users');
    } catch (e) {
        console.error('Create user error:', e);
        res.redirect('/admin/users');
    }
};

exports.updateUser = async (req, res) => {
    try {
        const { id, name, email, role, password } = req.body;
        const user = await User.findByPk(id);
        if (user) {
            user.name = name;
            user.email = email;
            user.role = role;
            if (password) user.password = await bcrypt.hash(password, 10);
            await user.save();
        }
        res.redirect('/admin/users');
    } catch (e) {
        console.error('Update user error:', e);
        res.redirect('/admin/users');
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.body;
        await User.destroy({ where: { id } });
        res.redirect('/admin/users');
    } catch (e) {
        console.error('Delete user error:', e);
        res.redirect('/admin/users');
    }
};

// ═══════════════════════════════════════
// COURSES CRUD
// ═══════════════════════════════════════
exports.coursesPage = async (req, res) => {
    try {
        const courses = await Course.findAll({ order: [['created_at', 'DESC']] });
        res.render('admin/courses', { title: 'Courses', user: req.session.user, courses });
    } catch (error) {
        console.error('Courses page error:', error);
        res.render('admin/courses', { title: 'Courses', user: req.session.user, courses: [] });
    }
};

exports.createCourse = async (req, res) => {
    try {
        const { title, short_desc, price, type, color, currency } = req.body;
        const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        await Course.create({ title, slug, short_desc, price: price || 0, type: type || 'free', color: color || 'blue', currency: currency || 'IDR' });
        res.redirect('/admin/courses');
    } catch (e) {
        console.error('Create course error:', e);
        res.redirect('/admin/courses');
    }
};

exports.updateCourse = async (req, res) => {
    try {
        const { id, title, short_desc, price, type, color, currency } = req.body;
        const course = await Course.findByPk(id);
        if (course) {
            course.title = title;
            course.short_desc = short_desc;
            course.price = price || 0;
            course.type = type || 'free';
            course.color = color || 'blue';
            course.currency = currency || 'IDR';
            course.slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            await course.save();
        }
        res.redirect('/admin/courses');
    } catch (e) {
        console.error('Update course error:', e);
        res.redirect('/admin/courses');
    }
};

exports.deleteCourse = async (req, res) => {
    try {
        await Course.destroy({ where: { id: req.body.id } });
        res.redirect('/admin/courses');
    } catch (e) {
        console.error('Delete course error:', e);
        res.redirect('/admin/courses');
    }
};

exports.courseMaterialsPage = async (req, res) => {
    try {
        const course = await Course.findByPk(req.params.id);
        const materials = await Material.findAll({
            where: { course_id: req.params.id },
            include: [{ model: Quiz, as: 'quiz' }],
            order: [['order', 'ASC']]
        });
        const quizzes = await Quiz.findAll();
        res.render('admin/course_materials', { user: req.session.user, course, materials, quizzes });
    } catch (error) {
        console.error('Course materials error:', error);
        res.redirect('/admin/courses');
    }
};

exports.createMaterial = async (req, res) => {
    try {
        const { title, type, content, video_url, quiz_id, order: sortOrder } = req.body;
        await Material.create({
            course_id: req.params.id,
            title, type: type || 'text', content, video_url,
            quiz_id: quiz_id || null,
            order: sortOrder || 0
        });
        res.redirect(`/admin/courses/${req.params.id}/materials`);
    } catch (e) {
        console.error('Create material error:', e);
        res.redirect(`/admin/courses/${req.params.id}/materials`);
    }
};

exports.deleteMaterial = async (req, res) => {
    try {
        await Material.destroy({ where: { id: req.body.id, course_id: req.params.id } });
        res.redirect(`/admin/courses/${req.params.id}/materials`);
    } catch (e) {
        console.error('Delete material error:', e);
        res.redirect(`/admin/courses/${req.params.id}/materials`);
    }
};

// ═══════════════════════════════════════
// QUIZZES CRUD
// ═══════════════════════════════════════
exports.quizzesPage = async (req, res) => {
    try {
        const quizzes = await Quiz.findAll({ order: [['created_at', 'DESC']] });
        res.render('admin/quizzes', { title: 'Quizzes', user: req.session.user, quizzes });
    } catch (error) {
        console.error('Quizzes page error:', error);
        res.render('admin/quizzes', { title: 'Quizzes', user: req.session.user, quizzes: [] });
    }
};

exports.createQuiz = async (req, res) => {
    try {
        const { title, description, duration_minutes, is_active } = req.body;
        await Quiz.create({ title, description, duration_minutes: duration_minutes || 0, is_active: is_active === 'on' || is_active === '1' });
        res.redirect('/admin/quizzes');
    } catch (e) {
        console.error('Create quiz error:', e);
        res.redirect('/admin/quizzes');
    }
};

exports.updateQuiz = async (req, res) => {
    try {
        const { id, title, description, duration_minutes, is_active } = req.body;
        const quiz = await Quiz.findByPk(id);
        if (quiz) {
            quiz.title = title;
            quiz.description = description;
            quiz.duration_minutes = duration_minutes || 0;
            quiz.is_active = is_active === 'on' || is_active === '1';
            await quiz.save();
        }
        res.redirect('/admin/quizzes');
    } catch (e) {
        console.error('Update quiz error:', e);
        res.redirect('/admin/quizzes');
    }
};

exports.deleteQuiz = async (req, res) => {
    try {
        await Quiz.destroy({ where: { id: req.body.id } });
        res.redirect('/admin/quizzes');
    } catch (e) {
        console.error('Delete quiz error:', e);
        res.redirect('/admin/quizzes');
    }
};

exports.quizQuestionsPage = async (req, res) => {
    try {
        const quiz = await Quiz.findByPk(req.params.id);
        if (!quiz) return res.redirect('/admin/quizzes');
        const questions = await QuizQuestion.findAll({
            where: { quiz_id: req.params.id },
            include: [{ model: QuizOption, as: 'options' }],
            order: [['order', 'ASC']]
        });
        res.render('admin/quiz_questions', { user: req.session.user, quiz, questions });
    } catch (error) {
        console.error('Quiz questions error:', error);
        res.redirect('/admin/quizzes');
    }
};

exports.createQuizQuestion = async (req, res) => {
    try {
        const { question, order: sortOrder, options, correct_option } = req.body;
        const q = await QuizQuestion.create({ quiz_id: req.params.id, question, order: sortOrder || 0 });
        if (options && Array.isArray(options)) {
            for (let i = 0; i < options.length; i++) {
                await QuizOption.create({
                    quiz_question_id: q.id,
                    option_text: options[i],
                    is_correct: parseInt(correct_option) === i
                });
            }
        }
        res.redirect(`/admin/quizzes/${req.params.id}/questions`);
    } catch (e) {
        console.error('Create question error:', e);
        res.redirect(`/admin/quizzes/${req.params.id}/questions`);
    }
};

exports.deleteQuizQuestion = async (req, res) => {
    try {
        await QuizOption.destroy({ where: { quiz_question_id: req.body.id } });
        await QuizQuestion.destroy({ where: { id: req.body.id } });
        res.redirect(`/admin/quizzes/${req.params.id}/questions`);
    } catch (e) {
        console.error('Delete question error:', e);
        res.redirect(`/admin/quizzes/${req.params.id}/questions`);
    }
};

// ═══════════════════════════════════════
// PRODUCTS CRUD (NEW)
// ═══════════════════════════════════════
exports.productsPage = async (req, res) => {
    try {
        const products = await Product.findAll({ order: [['created_at', 'DESC']] });
        res.render('admin/products', { user: req.session.user, products });
    } catch (error) {
        console.error('Products page error:', error);
        res.render('admin/products', { user: req.session.user, products: [] });
    }
};

exports.createProduct = async (req, res) => {
    try {
        const { name, description, price, link, is_active } = req.body;
        await Product.create({
            name, description, price: price || 0, link,
            image: req.file ? req.file.filename : null,
            is_active: is_active === 'on' || is_active === '1' || is_active === undefined
        });
        res.redirect('/admin/products');
    } catch (e) {
        console.error('Create product error:', e);
        res.redirect('/admin/products');
    }
};

exports.updateProduct = async (req, res) => {
    try {
        const { id, name, description, price, link, is_active } = req.body;
        const product = await Product.findByPk(id);
        if (product) {
            product.name = name;
            product.description = description;
            product.price = price || 0;
            product.link = link;
            product.is_active = is_active === 'on' || is_active === '1';
            if (req.file) product.image = req.file.filename;
            await product.save();
        }
        res.redirect('/admin/products');
    } catch (e) {
        console.error('Update product error:', e);
        res.redirect('/admin/products');
    }
};

exports.deleteProduct = async (req, res) => {
    try {
        const product = await Product.findByPk(req.body.id);
        if (product && product.image) {
            const filePath = path.join(__dirname, '..', 'public', 'uploads', product.image);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }
        await Product.destroy({ where: { id: req.body.id } });
        res.redirect('/admin/products');
    } catch (e) {
        console.error('Delete product error:', e);
        res.redirect('/admin/products');
    }
};

// ═══════════════════════════════════════
// POSTS CRUD (NEW)
// ═══════════════════════════════════════
exports.postsPage = async (req, res) => {
    try {
        const posts = await Post.findAll({
            include: [{ model: Category, as: 'category' }],
            order: [['created_at', 'DESC']]
        });
        const categories = await Category.findAll().catch(() => []);
        res.render('admin/posts', { user: req.session.user, posts, categories });
    } catch (error) {
        console.error('Posts page error:', error);
        res.render('admin/posts', { user: req.session.user, posts: [], categories: [] });
    }
};

exports.createPost = async (req, res) => {
    try {
        const { title, content, type, category_id, status, order: sortOrder } = req.body;
        const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.random().toString(36).substring(2, 7);
        await Post.create({
            title, slug, content, type: type || 'article',
            category_id: category_id || null,
            status: status || 'draft',
            order: sortOrder || 0,
            image: req.file ? req.file.filename : null,
        });
        res.redirect('/admin/posts');
    } catch (e) {
        console.error('Create post error:', e);
        res.redirect('/admin/posts');
    }
};

exports.updatePost = async (req, res) => {
    try {
        const { id, title, content, type, category_id, status, order: sortOrder } = req.body;
        const post = await Post.findByPk(id);
        if (post) {
            post.title = title;
            post.content = content;
            post.type = type || 'article';
            post.category_id = category_id || null;
            post.status = status || 'draft';
            post.order = sortOrder || 0;
            if (req.file) post.image = req.file.filename;
            await post.save();
        }
        res.redirect('/admin/posts');
    } catch (e) {
        console.error('Update post error:', e);
        res.redirect('/admin/posts');
    }
};

exports.deletePost = async (req, res) => {
    try {
        const post = await Post.findByPk(req.body.id);
        if (post && post.image) {
            const filePath = path.join(__dirname, '..', 'public', 'uploads', post.image);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }
        await Post.destroy({ where: { id: req.body.id } });
        res.redirect('/admin/posts');
    } catch (e) {
        console.error('Delete post error:', e);
        res.redirect('/admin/posts');
    }
};

// ═══════════════════════════════════════
// BANNERS CRUD (NEW)
// ═══════════════════════════════════════
exports.bannersPage = async (req, res) => {
    try {
        const banners = await Banner.findAll({ order: [['order', 'ASC']] });
        res.render('admin/banners', { user: req.session.user, banners });
    } catch (error) {
        console.error('Banners page error:', error);
        res.render('admin/banners', { user: req.session.user, banners: [] });
    }
};

exports.createBanner = async (req, res) => {
    try {
        const { title, subtitle, content, order: sortOrder, is_active } = req.body;
        const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.random().toString(36).substring(2, 7);
        await Banner.create({
            title, slug, subtitle, content,
            image: req.file ? req.file.filename : null,
            is_active: is_active === 'on' || is_active === '1', 
            order: sortOrder || 1
        });
        res.redirect('/admin/banners');
    } catch (e) {
        console.error('Create banner error:', e);
        res.redirect('/admin/banners');
    }
};

exports.updateBanner = async (req, res) => {
    try {
        const { id, title, subtitle, content, order: sortOrder, is_active } = req.body;
        const banner = await Banner.findByPk(id);
        if (banner) {
            banner.title = title;
            banner.subtitle = subtitle;
            banner.content = content;
            banner.order = sortOrder || 1;
            banner.is_active = is_active === 'on' || is_active === '1';
            if (req.file) banner.image = req.file.filename;
            await banner.save();
        }
        res.redirect('/admin/banners');
    } catch (e) {
        console.error('Update banner error:', e);
        res.redirect('/admin/banners');
    }
};

exports.deleteBanner = async (req, res) => {
    try {
        const banner = await Banner.findByPk(req.body.id);
        if (banner && banner.image) {
            const filePath = path.join(__dirname, '..', 'public', 'uploads', banner.image);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }
        await Banner.destroy({ where: { id: req.body.id } });
        res.redirect('/admin/banners');
    } catch (e) {
        console.error('Delete banner error:', e);
        res.redirect('/admin/banners');
    }
};

// ═══════════════════════════════════════
// ORDERS MANAGEMENT (NEW)
// ═══════════════════════════════════════
exports.ordersPage = async (req, res) => {
    try {
        const orders = await Order.findAll({
            include: [
                { model: User, attributes: ['id', 'name', 'email'] },
                { model: OrderItem, as: 'items', include: [{ model: Product }] }
            ],
            order: [['created_at', 'DESC']]
        });
        res.render('admin/orders', { user: req.session.user, orders });
    } catch (error) {
        console.error('Orders page error:', error);
        res.render('admin/orders', { user: req.session.user, orders: [] });
    }
};

exports.updateOrderStatus = async (req, res) => {
    try {
        const { id, status, admin_note } = req.body;
        const order = await Order.findByPk(id);
        if (order) {
            order.status = status;
            if (admin_note) order.admin_note = admin_note;
            await order.save();
        }
        res.redirect('/admin/orders');
    } catch (e) {
        console.error('Update order status error:', e);
        res.redirect('/admin/orders');
    }
};

// ═══════════════════════════════════════
// DEPOSITS MANAGEMENT (NEW)
// ═══════════════════════════════════════
exports.depositsPage = async (req, res) => {
    try {
        const deposits = await Deposit.findAll({
            include: [
                { model: User, attributes: ['id', 'name', 'email'] },
                { model: BankAccount }
            ],
            order: [['created_at', 'DESC']]
        });
        res.render('admin/deposits', { user: req.session.user, deposits });
    } catch (error) {
        console.error('Deposits page error:', error);
        res.render('admin/deposits', { user: req.session.user, deposits: [] });
    }
};

exports.approveDeposit = async (req, res) => {
    const sequelize = require('../config/database');
    const t = await sequelize.transaction();
    try {
        const { id } = req.body;
        const deposit = await Deposit.findByPk(id, { transaction: t });
        if (deposit && deposit.status === 'pending') {
            deposit.status = 'approved';
            await deposit.save({ transaction: t });
            // Add balance to user
            const u = await User.findByPk(deposit.user_id, { transaction: t });
            if (u) {
                u.balance = parseFloat(u.balance || 0) + parseFloat(deposit.amount);
                await u.save({ transaction: t });
            }
            await t.commit();
        } else {
            await t.rollback();
        }
        res.redirect('/admin/deposits');
    } catch (e) {
        await t.rollback();
        console.error('Approve deposit error:', e);
        res.redirect('/admin/deposits');
    }
};

exports.rejectDeposit = async (req, res) => {
    try {
        const deposit = await Deposit.findByPk(req.body.id);
        if (deposit && deposit.status === 'pending') {
            deposit.status = 'rejected';
            deposit.admin_note = req.body.admin_note || 'Ditolak oleh admin';
            await deposit.save();
        }
        res.redirect('/admin/deposits');
    } catch (e) {
        console.error('Reject deposit error:', e);
        res.redirect('/admin/deposits');
    }
};

// ═══════════════════════════════════════
// BANK ACCOUNTS CRUD (NEW)
// ═══════════════════════════════════════
exports.bankAccountsPage = async (req, res) => {
    try {
        const bankAccounts = await BankAccount.findAll({ order: [['created_at', 'DESC']] });
        res.render('admin/bank-accounts', { user: req.session.user, bankAccounts });
    } catch (error) {
        console.error('Bank accounts page error:', error);
        res.render('admin/bank-accounts', { user: req.session.user, bankAccounts: [] });
    }
};

exports.createBankAccount = async (req, res) => {
    try {
        const { bank_name, account_number, account_holder } = req.body;
        await BankAccount.create({ bank_name, account_number, account_holder, is_active: true });
        res.redirect('/admin/bank-accounts');
    } catch (e) {
        console.error('Create bank account error:', e);
        res.redirect('/admin/bank-accounts');
    }
};

exports.updateBankAccount = async (req, res) => {
    try {
        const { id, bank_name, account_number, account_holder, is_active } = req.body;
        const bank = await BankAccount.findByPk(id);
        if (bank) {
            bank.bank_name = bank_name;
            bank.account_number = account_number;
            bank.account_holder = account_holder;
            bank.is_active = is_active === 'on' || is_active === '1';
            await bank.save();
        }
        res.redirect('/admin/bank-accounts');
    } catch (e) {
        console.error('Update bank account error:', e);
        res.redirect('/admin/bank-accounts');
    }
};

exports.deleteBankAccount = async (req, res) => {
    try {
        await BankAccount.destroy({ where: { id: req.body.id } });
        res.redirect('/admin/bank-accounts');
    } catch (e) {
        console.error('Delete bank account error:', e);
        res.redirect('/admin/bank-accounts');
    }
};

// ═══════════════════════════════════════
// AI SETTINGS CRUD (NEW)
// ═══════════════════════════════════════
exports.aiSettingsPage = async (req, res) => {
    try {
        const aiSettings = await AiSetting.findAll({ order: [['created_at', 'DESC']] });
        res.render('admin/ai-settings', { user: req.session.user, aiSettings });
    } catch (error) {
        console.error('AI settings page error:', error);
        res.render('admin/ai-settings', { user: req.session.user, aiSettings: [] });
    }
};

exports.createAiSetting = async (req, res) => {
    try {
        const { provider, api_key, selected_model, system_prompt, reference_url, is_active } = req.body;
        await AiSetting.create({
            provider, api_key, selected_model, system_prompt, reference_url,
            is_active: is_active === 'on' || is_active === '1'
        });
        res.redirect('/admin/ai-settings');
    } catch (e) {
        console.error('Create AI setting error:', e);
        res.redirect('/admin/ai-settings');
    }
};

exports.updateAiSetting = async (req, res) => {
    try {
        const { id, provider, api_key, selected_model, system_prompt, reference_url, is_active } = req.body;
        const setting = await AiSetting.findByPk(id);
        if (setting) {
            setting.provider = provider;
            setting.api_key = api_key;
            setting.selected_model = selected_model;
            setting.system_prompt = system_prompt;
            setting.reference_url = reference_url;
            setting.is_active = is_active === 'on' || is_active === '1';
            await setting.save();
        }
        res.redirect('/admin/ai-settings');
    } catch (e) {
        console.error('Update AI setting error:', e);
        res.redirect('/admin/ai-settings');
    }
};

exports.deleteAiSetting = async (req, res) => {
    try {
        await AiSetting.destroy({ where: { id: req.body.id } });
        res.redirect('/admin/ai-settings');
    } catch (e) {
        console.error('Delete AI setting error:', e);
        res.redirect('/admin/ai-settings');
    }
};

// ═══════════════════════════════════════
// APP SETTINGS (NEW)
// ═══════════════════════════════════════
exports.appSettingsPage = async (req, res) => {
    try {
        const settings = await AppSetting.findOne({ where: { key: 'default' } });
        res.render('admin/app-settings', { user: req.session.user, settings: settings || {} });
    } catch (error) {
        console.error('App settings page error:', error);
        res.render('admin/app-settings', { user: req.session.user, settings: {} });
    }
};

exports.updateAppSettings = async (req, res) => {
    try {
        const { app_name, app_slogan, theme_color, font_family, blog_title, academy_slogan, academy_title, login_header_text } = req.body;
        let [settings] = await AppSetting.findOrCreate({ where: { key: 'default' } });
        settings.app_name = app_name || settings.app_name;
        settings.app_slogan = app_slogan;
        settings.theme_color = theme_color || 'blue';
        settings.font_family = font_family;
        settings.blog_title = blog_title;
        settings.academy_slogan = academy_slogan;
        settings.academy_title = academy_title;
        settings.login_header_text = login_header_text;
        if (req.file) settings.logo_path = req.file.filename;
        await settings.save();
        res.redirect('/admin/app-settings');
    } catch (e) {
        console.error('Update app settings error:', e);
        res.redirect('/admin/app-settings');
    }
};

// ═══════════════════════════════════════
// PRODUCT MESSAGES (NEW)
// ═══════════════════════════════════════
exports.productMessagesPage = async (req, res) => {
    try {
        const messages = await ProductMessage.findAll({
            include: [
                { model: User, attributes: ['id', 'name', 'email'] },
                { model: Product, attributes: ['id', 'name'] }
            ],
            order: [['created_at', 'DESC']]
        });
        res.render('admin/product-messages', { user: req.session.user, messages });
    } catch (error) {
        console.error('Product messages page error:', error);
        res.render('admin/product-messages', { user: req.session.user, messages: [] });
    }
};

// ═══════════════════════════════════════
// ANALYTICS
// ═══════════════════════════════════════
exports.analyticsPage = async (req, res) => {
    try {
        const totalUsers = await User.count();
        const totalCourses = await Course.count();
        const totalMaterials = await Material.count();
        const totalEnrollments = await CourseUser.count();
        
        const totalQuizzes = await Quiz.count();
        const totalAttempts = await QuizAttempt.count();
        const avgScore = await QuizAttempt.findOne({ attributes: [[fn('AVG', col('score')), 'avg']] });
        
        const quizStats = await Quiz.findAll({
            attributes: ['id', 'title'],
            include: [{ model: QuizQuestion, as: 'questions', attributes: ['id'] }]
        });
        
        res.render('admin/analytics', {
            title: 'Analytics',
            user: req.session.user,
            stats: { 
                users: totalUsers, 
                courses: totalCourses, 
                materials: totalMaterials, 
                enrollments: totalEnrollments,
                quizzes: totalQuizzes,
                attempts: totalAttempts,
                avgScore: avgScore?.get('avg') || 0 
            },
            quizStats
        });
    } catch (error) {
        console.error('Analytics error:', error);
        res.render('admin/analytics', { 
            title: 'Analytics', 
            user: req.session.user, 
            stats: { users: 0, courses: 0, materials: 0, enrollments: 0, quizzes: 0, attempts: 0, avgScore: 0 }, 
            quizStats: [] 
        });
    }
};

// ═══════════════════════════════════════
// USER PROFILE SETTINGS
// ═══════════════════════════════════════
exports.settingsPage = async (req, res) => {
    res.render('admin/settings', { title: 'Settings', user: req.session.user });
};

exports.updateSettings = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const user = await User.findByPk(req.session.user.id);
        
        if (user) {
            user.name = name;
            user.email = email;
            if (password) {
                user.password = await bcrypt.hash(password, 10);
            }
            await user.save();
            
            // Update session
            req.session.user = user;
            res.redirect('/admin/settings?success=true');
        } else {
            res.redirect('/admin/settings?error=true');
        }
    } catch (e) {
        console.error('Update profile settings error:', e);
        res.redirect('/admin/settings?error=true');
    }
};
