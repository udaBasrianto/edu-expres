const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

// Multer config for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.join(__dirname, '..', 'public', 'uploads')),
    filename: (req, file, cb) => {
        const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
        cb(null, uniqueName);
    }
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB

// Controllers
const homeController = require('../controllers/homeController');
const authController = require('../controllers/authController');
const classroomController = require('../controllers/classroomController');
const quizController = require('../controllers/quizController');
const adminController = require('../controllers/adminController');
const productController = require('../controllers/productController');
const cartController = require('../controllers/cartController');
const orderController = require('../controllers/orderController');
const postController = require('../controllers/postController');
const bannerController = require('../controllers/bannerController');
const topUpController = require('../controllers/topUpController');
const aiChatController = require('../controllers/aiChatController');
const certificateController = require('../controllers/certificateController');
const { isAdmin, isAuth } = require('../middleware/auth');

// ═══════════════════════════════════════
// PUBLIC ROUTES
// ═══════════════════════════════════════

// Home & Tabs
router.get('/', homeController.index);

// Products
router.get('/products', productController.list);
router.get('/product/:id', productController.show);

// Posts / Blog
router.get('/posts', postController.list);
router.get('/post/:slug', postController.show);

// Banner
router.get('/banner/:slug', bannerController.show);
router.get('/banners', bannerController.list);

// Courses
router.get('/courses', homeController.courses);
router.get('/courses/:id', homeController.courseDetail);

// Cart count (public — returns 0 if not logged in)
router.get('/cart/count', cartController.count);

// Leaderboard
router.get('/leaderboard/load-more', homeController.leaderboardLoadMore);

// Quiz
router.get('/quiz/:id', quizController.detail);
router.get('/quiz/result/:id', isAuth, quizController.result);

// AI Settings (public for frontend)
router.get('/ai/settings', aiChatController.getSettings);

// Bank accounts list (public)
router.get('/bank-accounts', topUpController.getBankAccounts);

// ═══════════════════════════════════════
// AUTH REQUIRED ROUTES
// ═══════════════════════════════════════

// Cart (DB-based)
router.post('/cart/add', isAuth, cartController.add);
router.post('/cart/remove', isAuth, cartController.remove);
router.get('/cart/items', isAuth, cartController.list);

// Orders
router.post('/order/checkout', isAuth, orderController.checkout);
router.post('/order/payment', isAuth, upload.single('payment_proof'), orderController.uploadPayment);
router.post('/order/pay-balance', isAuth, orderController.payWithBalance);

// Product Messages
router.post('/product/message', isAuth, productController.sendMessage);

// Top Up
router.post('/topup/process', isAuth, upload.single('proof_image'), topUpController.store);

// AI Chat
router.post('/ai/chat', isAuth, aiChatController.chat);

// Quiz submit
router.post('/quiz/submit', quizController.submit);

// Classroom
router.get('/classroom/:courseId', classroomController.index);
router.get('/classroom/:courseId/:materialId', classroomController.index);
router.post('/classroom/complete', classroomController.toggleComplete);

// Certificate
router.get('/certificate/download/:attemptId', isAuth, certificateController.download);

// Profile
router.post('/profile/update', isAuth, upload.single('avatar'), authController.updateProfile);
router.put('/profile/password', isAuth, authController.updatePassword);
router.get('/profile/orders', isAuth, authController.profileOrders);
router.get('/profile/chats', isAuth, authController.profileChats);

// ═══════════════════════════════════════
// AUTH ROUTES
// ═══════════════════════════════════════
router.get('/login', authController.loginPage);
router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.get('/register', authController.registerPage);
router.post('/register', authController.register);

// Admin Register
router.get('/admin/register', authController.adminRegisterPage);
router.post('/admin/register', authController.adminRegister);

// ═══════════════════════════════════════
// ADMIN ROUTES
// ═══════════════════════════════════════
router.get('/admin', isAdmin, adminController.dashboard);

// Admin Users
router.get('/admin/users', isAdmin, adminController.usersPage);
router.post('/admin/users/create', isAdmin, adminController.createUser);
router.post('/admin/users/update', isAdmin, adminController.updateUser);
router.post('/admin/users/delete', isAdmin, adminController.deleteUser);

// Admin Courses
router.get('/admin/courses', isAdmin, adminController.coursesPage);
router.post('/admin/courses/create', isAdmin, adminController.createCourse);
router.post('/admin/courses/update', isAdmin, adminController.updateCourse);
router.post('/admin/courses/delete', isAdmin, adminController.deleteCourse);
router.get('/admin/courses/:id/materials', isAdmin, adminController.courseMaterialsPage);
router.post('/admin/courses/:id/materials/create', isAdmin, adminController.createMaterial);
router.post('/admin/courses/:id/materials/delete', isAdmin, adminController.deleteMaterial);

// Admin Quizzes
router.get('/admin/quizzes', isAdmin, adminController.quizzesPage);
router.post('/admin/quizzes/create', isAdmin, adminController.createQuiz);
router.post('/admin/quizzes/update', isAdmin, adminController.updateQuiz);
router.post('/admin/quizzes/delete', isAdmin, adminController.deleteQuiz);
router.get('/admin/quizzes/:id/questions', isAdmin, adminController.quizQuestionsPage);
router.post('/admin/quizzes/:id/questions/create', isAdmin, adminController.createQuizQuestion);
router.post('/admin/quizzes/:id/questions/delete', isAdmin, adminController.deleteQuizQuestion);

// Admin Products
router.get('/admin/products', isAdmin, adminController.productsPage);
router.post('/admin/products/create', isAdmin, upload.single('image'), adminController.createProduct);
router.post('/admin/products/update', isAdmin, upload.single('image'), adminController.updateProduct);
router.post('/admin/products/delete', isAdmin, adminController.deleteProduct);

// Admin Posts
router.get('/admin/posts', isAdmin, adminController.postsPage);
router.post('/admin/posts/create', isAdmin, upload.single('image'), adminController.createPost);
router.post('/admin/posts/update', isAdmin, upload.single('image'), adminController.updatePost);
router.post('/admin/posts/delete', isAdmin, adminController.deletePost);
router.post('/admin/posts/scrape', isAdmin, postController.scrape);

// Admin Banners
router.get('/admin/banners', isAdmin, adminController.bannersPage);
router.post('/admin/banners/create', isAdmin, upload.single('image'), adminController.createBanner);
router.post('/admin/banners/update', isAdmin, upload.single('image'), adminController.updateBanner);
router.post('/admin/banners/delete', isAdmin, adminController.deleteBanner);

// Admin Orders
router.get('/admin/orders', isAdmin, adminController.ordersPage);
router.post('/admin/orders/update-status', isAdmin, adminController.updateOrderStatus);

// Admin Deposits
router.get('/admin/deposits', isAdmin, adminController.depositsPage);
router.post('/admin/deposits/approve', isAdmin, adminController.approveDeposit);
router.post('/admin/deposits/reject', isAdmin, adminController.rejectDeposit);

// Admin Bank Accounts
router.get('/admin/bank-accounts', isAdmin, adminController.bankAccountsPage);
router.post('/admin/bank-accounts/create', isAdmin, adminController.createBankAccount);
router.post('/admin/bank-accounts/update', isAdmin, adminController.updateBankAccount);
router.post('/admin/bank-accounts/delete', isAdmin, adminController.deleteBankAccount);

// Admin AI Settings
router.get('/admin/ai-settings', isAdmin, adminController.aiSettingsPage);
router.post('/admin/ai-settings/create', isAdmin, adminController.createAiSetting);
router.post('/admin/ai-settings/update', isAdmin, adminController.updateAiSetting);
router.post('/admin/ai-settings/delete', isAdmin, adminController.deleteAiSetting);

// Admin App Settings
router.get('/admin/app-settings', isAdmin, adminController.appSettingsPage);
router.post('/admin/app-settings/update', isAdmin, upload.single('logo'), adminController.updateAppSettings);

// Admin Product Messages
router.get('/admin/product-messages', isAdmin, adminController.productMessagesPage);

// Admin Analytics
router.get('/admin/analytics', isAdmin, adminController.analyticsPage);

// Admin Settings (old)
router.get('/admin/settings', isAdmin, adminController.settingsPage);
router.post('/admin/settings/update', isAdmin, adminController.updateSettings);

module.exports = router;
