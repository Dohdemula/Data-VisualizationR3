const router = require('express').Router();
const crypto = require('crypto');
const jwt    = require('jsonwebtoken');
const { v4: uuid } = require('uuid');
const { getDb } = require('../db');
const {
  sendRequestReceived, sendApprovalNotification,
  sendSetupToken, sendTokenIssuedConfirmation,
} = require('../email');

const IS_PUBLIC = process.env.IS_PUBLIC_INSTANCE === 'true';

function onlyPublic(req, res, next) {
  if (!IS_PUBLIC) return res.status(404).json({ error: 'Not found.' });
  next();
}

function hash(t) {
  return crypto.createHash('sha256').update(t).digest('hex');
}

// POST /api/requests — submit an access request
router.post('/', onlyPublic, async (req, res) => {
  const { businessName, name, email, phone, message } = req.body;

  if (!businessName || !name || !email || !phone) {
    return res.status(400).json({
      error: 'Business name, your name, email, and phone number are required.',
    });
  }

  const db  = getDb();
  const id  = uuid();
  const key = crypto.randomBytes(32).toString('hex');

  db.prepare(`
    INSERT INTO access_requests (id, business_name, name, email, phone, message, approval_key_hash)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, businessName, name, email, phone, message || null, hash(key));

  const approvalUrl = `${process.env.CLIENT_URL}/approve-request?id=${id}&key=${key}`;

  try {
    await sendRequestReceived({ to: email, name, businessName });
    await sendApprovalNotification({
      to: process.env.DEVELOPER_EMAIL,
      businessName, name, email, phone, message, approvalUrl,
    });
  } catch (err) {
    console.error('Email error on request submit:', err.message);
  }

  res.json({ ok: true });
});

// GET /api/requests/:id/details — load request details for the approval page
router.get('/:id/details', onlyPublic, (req, res) => {
  const { key } = req.query;
  if (!key) return res.status(400).json({ error: 'Approval key is required.' });

  const db  = getDb();
  const row = db.prepare(
    `SELECT * FROM access_requests WHERE id = ? AND status = 'pending'`
  ).get(req.params.id);

  if (!row)                            return res.status(404).json({ error: 'Request not found or already reviewed.' });
  if (row.approval_key_hash !== hash(key)) return res.status(403).json({ error: 'Invalid approval key.' });

  const { approval_key_hash, setup_token_hash, ...safe } = row;
  res.json(safe);
});

// POST /api/requests/:id/approve — developer confirms; generates + sends setup token
router.post('/:id/approve', onlyPublic, async (req, res) => {
  const { key } = req.query;
  if (!key) return res.status(400).json({ error: 'Approval key is required.' });

  const db  = getDb();
  const row = db.prepare(
    `SELECT * FROM access_requests WHERE id = ? AND status = 'pending'`
  ).get(req.params.id);

  if (!row)                            return res.status(404).json({ error: 'Request not found or already reviewed.' });
  if (row.approval_key_hash !== hash(key)) return res.status(403).json({ error: 'Invalid approval key.' });

  const setupToken = jwt.sign(
    {
      purpose:      'invensight-setup',
      email:        row.email,
      businessName: row.business_name,
      requestId:    row.id,
    },
    process.env.ADMIN_SECRET,
    { expiresIn: '7d' }
  );

  db.prepare(`
    UPDATE access_requests
    SET status = 'approved', setup_token_hash = ?, reviewed_at = unixepoch()
    WHERE id = ?
  `).run(hash(setupToken), row.id);

  try {
    await sendSetupToken({ to: row.email, name: row.name, businessName: row.business_name, token: setupToken });
    await sendTokenIssuedConfirmation({
      to: process.env.DEVELOPER_EMAIL,
      name: row.name, email: row.email, businessName: row.business_name,
    });
  } catch (err) {
    console.error('Email error on approval:', err.message);
  }

  res.json({ ok: true, message: `Setup token issued to ${row.email}.` });
});

module.exports = router;
