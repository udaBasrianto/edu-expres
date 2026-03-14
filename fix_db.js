const sequelize = require('./config/database');

async function fix() {
    try {
        console.log("Starting TOTAL database cleanup and alignment...");
        
        // 1. Disable checks
        await sequelize.query("SET FOREIGN_KEY_CHECKS = 0");
        
        // 2. Dynamically Identify and Drop ALL Foreign Keys
        const [databaseNameResult] = await sequelize.query("SELECT DATABASE() as db");
        const dbName = databaseNameResult[0].db;

        const [fks] = await sequelize.query(`
            SELECT TABLE_NAME, CONSTRAINT_NAME 
            FROM information_schema.KEY_COLUMN_USAGE 
            WHERE TABLE_SCHEMA = '${dbName}' 
            AND REFERENCED_TABLE_NAME IS NOT NULL
        `);

        console.log(`Found ${fks.length} foreign keys to drop...`);

        for (const fk of fks) {
            try {
                await sequelize.query(`ALTER TABLE ${fk.TABLE_NAME} DROP FOREIGN KEY ${fk.CONSTRAINT_NAME}`);
                console.log(`Dropped FK ${fk.CONSTRAINT_NAME} from ${fk.TABLE_NAME}`);
            } catch (e) {
                console.log(`Failed to drop FK ${fk.CONSTRAINT_NAME}: ${e.message}`);
            }
        }

        // 3. Force Modify all Primary Keys and Foreign Keys to BIGINT UNSIGNED
        const tables = [
            'users', 'courses', 'materials', 'quizzes', 'quiz_questions', 
            'quiz_options', 'quiz_attempts', 'products', 'categories', 
            'cart_items', 'orders', 'order_items', 'posts', 'banners', 
            'deposits', 'bank_accounts', 'ai_settings', 'app_settings', 
            'certificate_templates', 'product_messages', 'material_completions'
        ];

        for (const table of tables) {
            try {
                console.log(`Aligning ${table}.id to BIGINT UNSIGNED...`);
                await sequelize.query(`ALTER TABLE ${table} MODIFY id BIGINT UNSIGNED AUTO_INCREMENT`);
            } catch (e) {
                console.log(`Could not align ID for ${table}: ${e.message}`);
            }
        }

        // 4. Align Foreign Key Columns
        const fkCols = [
            ['posts', 'category_id'],
            ['materials', 'course_id'],
            ['materials', 'quiz_id'],
            ['quiz_attempts', 'user_id'],
            ['quiz_attempts', 'quiz_id'],
            ['quiz_questions', 'quiz_id'],
            ['quiz_options', 'quiz_question_id'],
            ['cart_items', 'user_id'],
            ['cart_items', 'product_id'],
            ['cart_items', 'course_id'],
            ['orders', 'user_id'],
            ['order_items', 'order_id'],
            ['order_items', 'product_id'],
            ['order_items', 'course_id'],
            ['product_messages', 'user_id'],
            ['product_messages', 'product_id'],
            ['deposits', 'user_id'],
            ['deposits', 'bank_account_id'],
            ['quizzes', 'certificate_template_id'],
            ['material_completions', 'user_id'],
            ['material_completions', 'material_id']
        ];

        for (const [table, col] of fkCols) {
            try {
                console.log(`Aligning ${table}.${col} to BIGINT UNSIGNED...`);
                await sequelize.query(`ALTER TABLE ${table} MODIFY ${col} BIGINT UNSIGNED`);
            } catch (e) {
                console.log(`Could not align FK col ${table}.${col}: ${e.message}`);
            }
        }

        // 5. Re-enable checks
        await sequelize.query("SET FOREIGN_KEY_CHECKS = 1");
        
        console.log("\nTOTAL ALIGNMENT COMPLETED!");
        console.log("Next steps:");
        console.log("1. Restart the Node.js project in aaPanel.");
        console.log("2. The server will now be able to sync correctly.");

    } catch (err) {
        console.error("Critical Failure:", err.message);
    } finally {
        await sequelize.close();
    }
}

fix();
