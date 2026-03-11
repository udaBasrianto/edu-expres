// Central model associations file
const User = require('./User');
const Course = require('./Course');
const CourseUser = require('./CourseUser');
const Material = require('./Material');
const MaterialCompletion = require('./MaterialCompletion');
const Quiz = require('./Quiz');
const QuizQuestion = require('./QuizQuestion');
const QuizOption = require('./QuizOption');
const QuizAttempt = require('./QuizAttempt');
const Product = require('./Product');
const Category = require('./Category');
const CartItem = require('./CartItem');
const Order = require('./Order');
const OrderItem = require('./OrderItem');
const Post = require('./Post');
const Banner = require('./Banner');
const Deposit = require('./Deposit');
const BankAccount = require('./BankAccount');
const AiSetting = require('./AiSetting');
const AppSetting = require('./AppSetting');
const CertificateTemplate = require('./CertificateTemplate');
const ProductMessage = require('./ProductMessage');

// ─── Existing Associations ───
Course.hasMany(Material, { foreignKey: 'course_id', as: 'materials' });
Material.belongsTo(Course, { foreignKey: 'course_id' });
Material.belongsTo(Quiz, { foreignKey: 'quiz_id', as: 'quiz' });

Course.belongsToMany(User, { through: CourseUser, foreignKey: 'course_id' });
User.belongsToMany(Course, { through: CourseUser, foreignKey: 'user_id' });
CourseUser.belongsTo(Course, { foreignKey: 'course_id' });
CourseUser.belongsTo(User, { foreignKey: 'user_id' });

Quiz.hasMany(QuizQuestion, { foreignKey: 'quiz_id', as: 'questions' });
QuizQuestion.belongsTo(Quiz, { foreignKey: 'quiz_id' });
QuizQuestion.hasMany(QuizOption, { foreignKey: 'quiz_question_id', as: 'options' });
QuizOption.belongsTo(QuizQuestion, { foreignKey: 'quiz_question_id' });

QuizAttempt.belongsTo(User, { foreignKey: 'user_id' });
QuizAttempt.belongsTo(Quiz, { foreignKey: 'quiz_id' });
User.hasMany(QuizAttempt, { foreignKey: 'user_id' });

// ─── New Associations ───

// Product & Category
Post.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });
Category.hasMany(Post, { foreignKey: 'category_id', as: 'posts' });

// CartItem
CartItem.belongsTo(User, { foreignKey: 'user_id' });
CartItem.belongsTo(Product, { foreignKey: 'product_id' });
CartItem.belongsTo(Course, { foreignKey: 'course_id' });
User.hasMany(CartItem, { foreignKey: 'user_id' });
Product.hasMany(CartItem, { foreignKey: 'product_id' });
Course.hasMany(CartItem, { foreignKey: 'course_id' });

// Order & OrderItem
Order.belongsTo(User, { foreignKey: 'user_id' });
Order.hasMany(OrderItem, { foreignKey: 'order_id', as: 'items' });
OrderItem.belongsTo(Order, { foreignKey: 'order_id' });
OrderItem.belongsTo(Product, { foreignKey: 'product_id' });
OrderItem.belongsTo(Course, { foreignKey: 'course_id' });
User.hasMany(Order, { foreignKey: 'user_id' });
Course.hasMany(OrderItem, { foreignKey: 'course_id' });

// Deposit & BankAccount
Deposit.belongsTo(User, { foreignKey: 'user_id' });
Deposit.belongsTo(BankAccount, { foreignKey: 'bank_account_id' });
User.hasMany(Deposit, { foreignKey: 'user_id' });

// ProductMessage
ProductMessage.belongsTo(User, { foreignKey: 'user_id' });
ProductMessage.belongsTo(Product, { foreignKey: 'product_id' });
User.hasMany(ProductMessage, { foreignKey: 'user_id', as: 'productMessages' });
Product.hasMany(ProductMessage, { foreignKey: 'product_id', as: 'messages' });

// Quiz Certificate
Quiz.belongsTo(CertificateTemplate, { foreignKey: 'certificate_template_id', as: 'certificateTemplate' });

module.exports = {
    User, Course, CourseUser, Material, MaterialCompletion,
    Quiz, QuizQuestion, QuizOption, QuizAttempt,
    Product, Category, CartItem, Order, OrderItem,
    Post, Banner, Deposit, BankAccount,
    AiSetting, AppSetting, CertificateTemplate, ProductMessage
};
