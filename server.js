const express = require('express');
const app = express();
const path = require('path');
const session = require('express-session');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const fs = require('fs');

dotenv.config();

const port = process.env.PORT || 3000;

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: process.env.SESSION_SECRET || 'secret-key',
    resave: false,
    saveUninitialized: true
}));

// View Engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Load all models and associations
const models = require('./models');

// Routes
const mainRoutes = require('./routes/index');
app.use('/', mainRoutes);

async function ensureAdmin() {
    try {
        const existing = await models.User.findOne({ where: { role: 'admin' } });
        if (!existing) {
            const email = process.env.DEFAULT_ADMIN_EMAIL || 'admin@hsi.test';
            const password = process.env.DEFAULT_ADMIN_PASSWORD || 'admin123';
            const hashed = await bcrypt.hash(password, 10);
            await models.User.create({
                name: 'Admin',
                email,
                password: hashed,
                role: 'admin',
                is_admin: true,
            });
            console.log('Default admin created:', email);
        }
    } catch (e) {
        console.error('Admin seed error:', e.message);
    }
}

// Ensure default app settings exist
async function ensureAppSettings() {
    try {
        const existing = await models.AppSetting.findOne({ where: { key: 'default' } });
        if (!existing) {
            await models.AppSetting.create({
                key: 'default',
                app_name: 'Edu HSI (Express)',
                theme_color: 'blue',
            });
            console.log('Default app settings created');
        }
    } catch (e) {
        // Table might not exist yet - that's ok
    }
}

// Use sequelize from config to sync database
const sequelize = require('./config/database');

sequelize.sync({ alter: true }).then(() => {
    console.log('Database synchronized and tables created.');
    ensureAdmin();
    ensureAppSettings();
    
    app.listen(port, () => {
        console.log(`Server running on http://localhost:${port}`);
    });
}).catch(err => {
    console.error('Database sync error:', err);
});

