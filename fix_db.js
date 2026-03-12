const sequelize = require('./config/database');

async function fix() {
    try {
        console.log("Altering posts.category_id to BIGINT UNSIGNED...");
        await sequelize.query("ALTER TABLE posts MODIFY category_id BIGINT UNSIGNED");
        console.log("Success!");
    } catch (err) {
        console.error("Error:", err.message);
    } finally {
        await sequelize.close();
    }
}

fix();
