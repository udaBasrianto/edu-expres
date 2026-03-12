const sequelize = require('./config/database');

async function check() {
    try {
        const [results, metadata] = await sequelize.query("DESCRIBE categories");
        console.log("Categories table structure:");
        console.table(results);

        const [results2, metadata2] = await sequelize.query("DESCRIBE posts");
        console.log("Posts table structure:");
        console.table(results2);
    } catch (err) {
        console.error("Error:", err.message);
    } finally {
        await sequelize.close();
    }
}

check();
