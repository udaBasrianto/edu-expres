exports.isAuthenticated = (req, res, next) => {
    if (req.session.user) {
        return next();
    }
    res.redirect('/?tab=login');
};

// Alias for route usage
exports.isAuth = (req, res, next) => {
    if (req.session.user) {
        return next();
    }
    res.status(401).json({ success: false, message: 'Silakan login terlebih dahulu' });
};

exports.isAdmin = (req, res, next) => {
    if (req.session.user && req.session.user.role === 'admin') {
        return next();
    }
    // If logged in but not admin, redirect to home
    if (req.session.user) {
        return res.redirect('/');
    }
    // If not logged in, redirect to login
    res.redirect('/?tab=login');
};

