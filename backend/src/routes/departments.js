const router = require('express').Router();
const Department = require('../models/Department');
const { authenticate, requireRole } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// GET /departments
router.get('/', async (req, res) => {
  const depts = await Department.find().sort('name');
  res.json(depts);
});

// GET /departments/:id
router.get('/:id', async (req, res) => {
  const dept = await Department.findById(req.params.id);
  if (!dept) return res.status(404).json({ message: 'Department not found' });
  res.json(dept);
});

// POST /departments  (admin only)
router.post('/', requireRole('admin'), async (req, res) => {
  const { name, code } = req.body;
  if (!name || !code) return res.status(400).json({ message: 'name and code are required' });
  const dept = await Department.create({ name, code });
  res.status(201).json(dept);
});

// PUT /departments/:id  (admin only)
router.put('/:id', requireRole('admin'), async (req, res) => {
  const dept = await Department.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!dept) return res.status(404).json({ message: 'Department not found' });
  res.json(dept);
});

// DELETE /departments/:id  (admin only)
router.delete('/:id', requireRole('admin'), async (req, res) => {
  const dept = await Department.findByIdAndDelete(req.params.id);
  if (!dept) return res.status(404).json({ message: 'Department not found' });
  res.status(204).send();
});

module.exports = router;
