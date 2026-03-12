const sequelize = require('./config/database');

async function fix() {
    try {
        console.log("Starting advanced database fix...");
        
        // Disable foreign key checks temporarily
        await sequelize.query("SET FOREIGN_KEY_CHECKS = 0");
        
        const tablesToFix = [
            { table: 'posts', columns: ['category_id'] },
            { table: 'materials', columns: ['course_id', 'quiz_id'] },
            { table: 'quiz_attempts', columns: ['user_id', 'quiz_id'] },
            { table: 'course_users', columns: ['user_id', 'course_id'] },
            { table: 'cart_items', columns: ['user_id', 'product_id', 'course_id'] },
            { table: 'orders', columns: ['user_id'] },
            { table: 'order_items', columns: ['order_id', 'product_id', 'course_id'] },
            { table: 'product_messages', columns: ['user_id', 'product_id'] },
            { table: 'deposits', columns: ['user_id', 'bank_account_id'] },
            { table: 'material_completions', columns: ['user_id', 'material_id'] },
            { table: 'quizzes', columns: ['certificate_template_id'] }
        ];

        for (const item of tablesToFix) {
            for (const col of item.columns) {
                try {
                    console.log(`Fixing ${item.table}.${col} to BIGINT UNSIGNED...`);
                    // We use MODIFY to change the type while keeping other properties if possible
                    // Note: This might need adjustment if columns are NOT NULL, but usually these FKs are NULL-able
                    await sequelize.query(`ALTER TABLE ${item.table} MODIFY ${col} BIGINT UNSIGNED`);
                } catch (e) {
                    console.warn(`Could not fix ${item.table}.${col}: ${e.message}`);
                }
            }
        }

        // Re-enable foreign key checks
        await sequelize.query("SET FOREIGN_KEY_CHECKS = 1");
        
        console.log("\nAdvanced fix completed!");
        console.log("Now please restart your Node.js project in aaPanel to let Sequelize sync the relations.");
        
    } catch (err) {
        console.error("Critical Error during fix:", err.message);
    } finally {
        await sequelize.close();
    }
}

fix();
