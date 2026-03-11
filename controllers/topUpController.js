const { Deposit, BankAccount, User } = require('../models');

// Store deposit/top-up request
exports.store = async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { amount, bank_account_id } = req.body;

    if (!amount || amount < 10000) {
        return res.status(400).json({ success: false, message: 'Minimal top up Rp 10.000' });
    }

    if (!bank_account_id) {
        return res.status(400).json({ success: false, message: 'Pilih rekening tujuan' });
    }

    try {
        let proofPath = null;
        if (req.file) {
            proofPath = 'uploads/' + req.file.filename;
        }

        await Deposit.create({
            user_id: req.session.user.id,
            bank_account_id,
            amount,
            status: 'pending',
            proof_image: proofPath,
        });

        const bank = await BankAccount.findByPk(bank_account_id);
        const formattedAmount = new Intl.NumberFormat('id-ID').format(amount);

        res.json({
            success: true,
            message: `Permintaan Top Up Rp ${formattedAmount} berhasil dibuat. Silakan transfer ke ${bank.bank_name} (${bank.account_number} a.n ${bank.account_holder}). Tunggu konfirmasi Admin.`
        });
    } catch (error) {
        console.error('TopUp store error:', error);
        res.status(500).json({ success: false, message: 'Gagal membuat permintaan top up' });
    }
};

// Get bank accounts list (for frontend)
exports.getBankAccounts = async (req, res) => {
    try {
        const banks = await BankAccount.findAll({ where: { is_active: true } });
        res.json(banks);
    } catch (error) {
        console.error('Get bank accounts error:', error);
        res.status(500).json([]);
    }
};
