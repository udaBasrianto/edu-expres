const sequelize = require('./config/database');
const Quiz = require('./models/Quiz');
const QuizQuestion = require('./models/QuizQuestion');
const QuizOption = require('./models/QuizOption');

async function seed() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        // Disable foreign key checks
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 0', { raw: true });

        // Drop leftover tables if any
        await sequelize.query('DROP TABLE IF EXISTS quiz_options', { raw: true });
        await sequelize.query('DROP TABLE IF EXISTS quiz_attempt_answers', { raw: true });
        await sequelize.query('DROP TABLE IF EXISTS quiz_attempts', { raw: true });
        await sequelize.query('DROP TABLE IF EXISTS quiz_questions', { raw: true });
        await sequelize.query('DROP TABLE IF EXISTS quizzes', { raw: true });

        // Sync tables
        await Quiz.sync({ force: true });
        await QuizQuestion.sync({ force: true });
        await QuizOption.sync({ force: true });
        
        // Enable foreign key checks
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 1', { raw: true });
        
        console.log('Quiz tables synced.');

        // Create a Quiz
        const quiz = await Quiz.create({
            title: 'Kuis Pemahaman Dasar Islam',
            description: 'Uji pemahaman Anda tentang rukun Islam dan rukun Iman.',
            duration_minutes: 10,
            is_active: true
        });

        // Questions
        const questionsData = [
            {
                text: 'Berapakah jumlah rukun Islam?',
                options: [
                    { label: 'A', text: '3', is_correct: false },
                    { label: 'B', text: '4', is_correct: false },
                    { label: 'C', text: '5', is_correct: true },
                    { label: 'D', text: '6', is_correct: false }
                ]
            },
            {
                text: 'Manakah yang termasuk rukun Iman?',
                options: [
                    { label: 'A', text: 'Puasa Ramadhan', is_correct: false },
                    { label: 'B', text: 'Beriman kepada Malaikat', is_correct: true },
                    { label: 'C', text: 'Membayar Zakat', is_correct: false },
                    { label: 'D', text: 'Haji', is_correct: false }
                ]
            },
            {
                text: 'Kitab suci umat Islam adalah...',
                options: [
                    { label: 'A', text: 'Taurat', is_correct: false },
                    { label: 'B', text: 'Zabur', is_correct: false },
                    { label: 'C', text: 'Injil', is_correct: false },
                    { label: 'D', text: 'Al-Qur\'an', is_correct: true }
                ]
            }
        ];

        for (const [index, qData] of questionsData.entries()) {
            const question = await QuizQuestion.create({
                quiz_id: quiz.id,
                question_text: qData.text,
                order: index + 1
            });

            for (const optData of qData.options) {
                await QuizOption.create({
                    quiz_question_id: question.id,
                    label: optData.label,
                    text: optData.text,
                    is_correct: optData.is_correct
                });
            }
        }

        // Another Quiz
        const quiz2 = await Quiz.create({
            title: 'Kuis Tajwid Dasar',
            description: 'Latihan hukum nun mati dan tanwin.',
            duration_minutes: 15,
            is_active: true
        });

        await QuizQuestion.create({
            quiz_id: quiz2.id,
            question_text: 'Apabila nun mati bertemu dengan huruf ba, maka hukum bacaannya adalah...',
            order: 1
        }).then(async (q) => {
            await QuizOption.create({ quiz_question_id: q.id, label: 'A', text: 'Idgham', is_correct: false });
            await QuizOption.create({ quiz_question_id: q.id, label: 'B', text: 'Iqlab', is_correct: true });
            await QuizOption.create({ quiz_question_id: q.id, label: 'C', text: 'Izhar', is_correct: false });
            await QuizOption.create({ quiz_question_id: q.id, label: 'D', text: 'Ikhfa', is_correct: false });
        });

        console.log('Seeding quizzes completed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Seeding error:', error);
        process.exit(1);
    }
}

seed();
