const sequelize = require('./config/database');

async function check() {
    try {
        const [results, metadata] = await sequelize.query("DESCRIBE quizzes");
        console.log("Quizzes table structure:");
        console.table(results);

        const [results2, metadata2] = await sequelize.query("DESCRIBE materials");
        console.log("Materials table structure:");
        console.table(results2);
    } catch (err) {
        console.error("Error:", err.message);
    } finally {
        await sequelize.close();
    }
}

check();
