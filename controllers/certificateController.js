const PDFDocument = require('pdfkit');
const QuizAttempt = require('../models/QuizAttempt');
const Quiz = require('../models/Quiz');
const User = require('../models/User');
const CertificateTemplate = require('../models/CertificateTemplate');

exports.download = async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }

    try {
        const attempt = await QuizAttempt.findByPk(req.params.attemptId, {
            include: [
                { model: Quiz },
                { model: User }
            ]
        });

        if (!attempt) {
            return res.status(404).json({ message: 'Attempt not found' });
        }

        // Authorization
        if (attempt.user_id !== req.session.user.id && !req.session.user.is_admin) {
            return res.status(403).json({ message: 'Forbidden' });
        }

        // Check certificate threshold
        const threshold = attempt.Quiz ? attempt.Quiz.certificate_threshold : null;
        if (threshold === null || threshold === undefined) {
            return res.status(404).json({ message: 'Certificate not available for this quiz.' });
        }

        if (attempt.score < threshold) {
            return res.status(403).json({ message: 'Score validation failed. Minimum score required: ' + threshold });
        }

        const userName = attempt.User ? attempt.User.name : 'Pengguna';
        const quizTitle = attempt.Quiz ? attempt.Quiz.title : 'Kuis';
        const score = attempt.score;
        const certDate = attempt.completed_at
            ? new Date(attempt.completed_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
            : new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
        const certId = 'HSI-CERT-' + String(attempt.id).padStart(6, '0');

        // Generate PDF with PDFKit
        const doc = new PDFDocument({
            layout: 'landscape',
            size: 'A4',
            margins: { top: 40, bottom: 40, left: 40, right: 40 }
        });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Sertifikat-${quizTitle}.pdf`);
        doc.pipe(res);

        const pageWidth = doc.page.width;
        const pageHeight = doc.page.height;

        // Border pattern
        doc.lineWidth(3);
        doc.rect(20, 20, pageWidth - 40, pageHeight - 40).stroke('#1e3a8a');
        doc.lineWidth(1);
        doc.rect(25, 25, pageWidth - 50, pageHeight - 50).stroke('#1e3a8a');

        // Header Logo
        doc.fontSize(36).font('Helvetica-Bold').fillColor('#1e3a8a')
            .text('Edu HSI', 0, 70, { align: 'center' });

        // Subtitle
        doc.moveDown(0.5);
        doc.fontSize(16).font('Helvetica').fillColor('#555555')
            .text('SERTIFIKAT KELULUSAN', { align: 'center' });

        // Divider
        const centerX = pageWidth / 2;
        doc.moveTo(centerX - 100, doc.y + 15).lineTo(centerX + 100, doc.y + 15).stroke('#cccccc');
        doc.moveDown(1.5);

        // Content
        doc.fontSize(14).font('Helvetica').fillColor('#333333')
            .text('Diberikan kepada:', { align: 'center' });
        doc.moveDown(0.5);

        // Name
        doc.fontSize(28).font('Helvetica-Bold').fillColor('#000000')
            .text(userName, { align: 'center' });

        // Underline for name
        const nameWidth = doc.widthOfString(userName);
        const nameX = (pageWidth - nameWidth) / 2;
        doc.moveTo(nameX, doc.y + 5).lineTo(nameX + nameWidth, doc.y + 5).stroke('#cccccc');
        doc.moveDown(1);

        doc.fontSize(14).font('Helvetica').fillColor('#333333')
            .text('Atas keberhasilannya menyelesaikan dan lulus ujian pada materi:', { align: 'center' });
        doc.moveDown(0.5);

        // Quiz title
        doc.fontSize(22).font('Helvetica-Bold').fillColor('#1e3a8a')
            .text(quizTitle, { align: 'center' });
        doc.moveDown(0.5);

        // Score
        doc.fontSize(14).font('Helvetica').fillColor('#333333')
            .text('Dengan Nilai Akhir:', { align: 'center' });
        doc.moveDown(0.3);
        doc.fontSize(24).font('Helvetica-Bold').fillColor('#059669')
            .text(String(score), { align: 'center' });
        doc.moveDown(0.5);

        // Quote
        doc.fontSize(11).font('Helvetica-Oblique').fillColor('#666666')
            .text('"Semoga ilmu yang didapatkan bermanfaat bagi diri sendiri dan umat."', { align: 'center' });

        // Footer
        doc.moveDown(2);
        doc.fontSize(12).font('Helvetica').fillColor('#333333')
            .text('Date: ' + certDate, pageWidth / 2 + 80, doc.y, { width: 250 });
        doc.moveDown(2);
        doc.moveTo(pageWidth / 2 + 80, doc.y).lineTo(pageWidth / 2 + 280, doc.y).stroke('#333333');
        doc.moveDown(0.3);
        doc.fontSize(12).font('Helvetica-Bold').fillColor('#333333')
            .text('Admin Edu HSI', pageWidth / 2 + 80, doc.y, { width: 250 });

        // Certificate ID
        doc.fontSize(8).font('Helvetica').fillColor('#aaaaaa')
            .text('ID: ' + certId, pageWidth - 180, pageHeight - 40, { width: 140, align: 'right' });

        doc.end();

    } catch (error) {
        console.error('Certificate Download Error:', error);
        res.status(500).json({ message: 'Gagal membuat sertifikat' });
    }
};
