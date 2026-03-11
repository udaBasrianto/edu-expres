const Course = require('../models/Course');
const Material = require('../models/Material');
const CourseUser = require('../models/CourseUser');
const MaterialCompletion = require('../models/MaterialCompletion');

exports.index = async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }

    const courseId = req.params.courseId;
    const materialId = req.params.materialId;

    try {
        // Check enrollment
        const enrollment = await CourseUser.findOne({
            where: {
                user_id: req.session.user.id,
                course_id: courseId,
                status: 'active'
            }
        });

        if (!enrollment) {
            return res.redirect('/?tab=academy&error=not_enrolled');
        }

        const course = await Course.findByPk(courseId, {
            include: [{
                model: Material,
                as: 'materials',
                include: [{
                    model: Quiz,
                    as: 'quiz'
                }]
            }],
            order: [
                [{ model: Material, as: 'materials' }, 'order', 'ASC']
            ]
        });

        if (!course) {
            return res.status(404).send('Course not found');
        }

        let currentMaterial = null;
        let currentIndex = -1;

        if (materialId) {
            currentMaterial = course.materials.find((m, index) => {
                if (m.id == materialId) {
                    currentIndex = index;
                    return true;
                }
                return false;
            });
        } else if (course.materials.length > 0) {
            currentMaterial = course.materials[0];
            currentIndex = 0;
        }

        // Get completed materials for this course
        const completedMaterials = await MaterialCompletion.findAll({
            where: {
                user_id: req.session.user.id,
                material_id: course.materials.map(m => m.id)
            }
        });

        const completedIds = completedMaterials.map(cm => cm.material_id);

        // Determine Next and Prev
        let prevMaterial = null;
        let nextMaterial = null;

        if (currentIndex > 0) {
            prevMaterial = course.materials[currentIndex - 1];
        }
        if (currentIndex < course.materials.length - 1) {
            nextMaterial = course.materials[currentIndex + 1];
        }

        res.render('classroom', {
            course,
            currentMaterial,
            user: req.session.user,
            materials: course.materials,
            completedIds,
            prevMaterial,
            nextMaterial
        });

    } catch (error) {
        console.error('Classroom Error:', error);
        res.status(500).send('Internal Server Error');
    }
};

exports.toggleComplete = async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { materialId } = req.body;

    try {
        const existing = await MaterialCompletion.findOne({
            where: {
                user_id: req.session.user.id,
                material_id: materialId
            }
        });

        let completed = false;
        if (existing) {
            await existing.destroy();
        } else {
            await MaterialCompletion.create({
                user_id: req.session.user.id,
                material_id: materialId
            });
            completed = true;
        }

        res.json({ success: true, completed });

    } catch (error) {
        console.error('Toggle Complete Error:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};
