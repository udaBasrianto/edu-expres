const sequelize = require('./config/database');
const Course = require('./models/Course');
const Material = require('./models/Material');

async function seed() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        // Sync Material table (create if not exists)
        await Material.sync({ force: true }); 
        console.log('Material table synced.');

        const courses = await Course.findAll();
        if (courses.length === 0) {
            console.log('No courses found. Please seed courses first.');
            process.exit(0);
        }

        for (const course of courses) {
            console.log(`Seeding materials for course: ${course.title}`);
            
            const materials = [
                {
                    course_id: course.id,
                    title: 'Mukadimah / Pengenalan',
                    type: 'video',
                    duration: '05:00',
                    order: 1,
                    media_url: 'https://www.youtube.com/watch?v=ScMzIvxBSi4' 
                },
                {
                    course_id: course.id,
                    title: 'Bab 1: Konsep Dasar',
                    type: 'video',
                    duration: '12:30',
                    order: 2,
                    media_url: 'https://www.youtube.com/watch?v=9xwazD5SyVg' 
                },
                {
                    course_id: course.id,
                    title: 'Modul Bacaan',
                    type: 'pdf',
                    duration: '15 min',
                    order: 3,
                    link: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
                },
                {
                    course_id: course.id,
                    title: 'Bab 2: Implementasi',
                    type: 'video',
                    duration: '20:00',
                    order: 4,
                    media_url: 'https://www.youtube.com/watch?v=C0DPdy98e4c' 
                }
            ];

            await Material.bulkCreate(materials);
        }

        console.log('Seeding materials completed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Seeding error:', error);
        process.exit(1);
    }
}

seed();
