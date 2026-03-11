const Quiz = require('../models/Quiz');
const QuizQuestion = require('../models/QuizQuestion');
const QuizOption = require('../models/QuizOption');
const QuizAttempt = require('../models/QuizAttempt');
const Material = require('../models/Material');
const MaterialCompletion = require('../models/MaterialCompletion');

exports.detail = async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }

    try {
        const quiz = await Quiz.findByPk(req.params.id, {
            include: [{
                model: QuizQuestion,
                as: 'questions',
                include: [{
                    model: QuizOption,
                    as: 'options'
                }]
            }],
            order: [
                [{ model: QuizQuestion, as: 'questions' }, 'order', 'ASC'],
                [{ model: QuizQuestion, as: 'questions' }, { model: QuizOption, as: 'options' }, 'id', 'ASC']
            ]
        });

        if (!quiz) {
            return res.redirect('/?tab=quiz&error=not_found');
        }

        res.render('quiz-detail', {
            quiz,
            user: req.session.user
        });

    } catch (error) {
        console.error('Quiz Detail Error:', error);
        res.status(500).send('Internal Server Error');
    }
};

exports.submit = async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { quizId, answers } = req.body; // answers: { questionId: optionId }

    try {
        const quiz = await Quiz.findByPk(quizId, {
            include: [{
                model: QuizQuestion,
                as: 'questions',
                include: [{
                    model: QuizOption,
                    as: 'options'
                }]
            }]
        });

        if (!quiz) {
            return res.status(404).json({ success: false, message: 'Quiz not found' });
        }

        let score = 0;
        let correctCount = 0;
        const totalQuestions = quiz.questions.length;

        if (!answers || typeof answers !== 'object') {
            return res.status(400).json({ success: false, message: 'Jawaban tidak valid' });
        }
        if (totalQuestions === 0) {
            return res.status(400).json({ success: false, message: 'Kuis belum memiliki soal' });
        }

        quiz.questions.forEach(question => {
            const selectedOptionId = answers[question.id];
            const correctOption = question.options.find(opt => opt.is_correct);

            if (correctOption && selectedOptionId == correctOption.id) {
                correctCount++;
            }
        });

        score = (correctCount / totalQuestions) * 100;

        // Save attempt
        try {
            await QuizAttempt.create({
                user_id: req.session.user.id,
                quiz_id: quizId,
                score: score,
                correct_count: correctCount,
                total_questions: totalQuestions
            });
        } catch (e) {
            console.warn('Failed to save quiz attempt:', e.message);
        }

        // Check if passed (e.g. > 70%) and mark material as complete if linked
        if (score >= 70) {
            try {
                const material = await Material.findOne({ where: { quiz_id: quizId } });
                if (material) {
                    await MaterialCompletion.findOrCreate({
                        where: {
                            user_id: req.session.user.id,
                            material_id: material.id
                        }
                    });
                }
            } catch (e) {
                console.warn('Failed to mark material completion:', e.message);
            }
        }

        res.json({
            success: true,
            score,
            correctCount,
            totalQuestions,
            message: `Anda menjawab ${correctCount} dari ${totalQuestions} soal dengan benar.`
        });

    } catch (error) {
        console.error('Quiz Submit Error:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

// Quiz Result — GET /quiz/result/:id
exports.result = async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    try {
        const attempt = await QuizAttempt.findByPk(req.params.id, {
            include: [{ model: Quiz }]
        });

        if (!attempt) {
            return res.status(404).json({ success: false, message: 'Attempt not found' });
        }

        if (attempt.user_id !== req.session.user.id) {
            return res.status(403).json({ success: false, message: 'Forbidden' });
        }

        const hasCertificate = attempt.Quiz && attempt.Quiz.certificate_threshold !== null && attempt.Quiz.certificate_threshold !== undefined;

        res.json({
            success: true,
            attempt: {
                id: attempt.id,
                quiz_id: attempt.quiz_id,
                quiz_title: attempt.Quiz ? attempt.Quiz.title : 'Kuis',
                score: attempt.score,
                correct_count: attempt.correct_count || 0,
                total_questions: attempt.total_questions || 0,
                completed_at: attempt.completed_at || attempt.created_at,
                has_certificate: hasCertificate
            }
        });
    } catch (error) {
        console.error('Quiz Result Error:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};
