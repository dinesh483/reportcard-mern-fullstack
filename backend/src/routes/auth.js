const router = require('express').Router();
const User = require('../models/User');
const Student = require('../models/Student');
const { signToken, authenticate } = require('../middleware/auth');

// POST /auth/register
router.post('/register', async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: 'name, email, password, role are required' });
  }
  if (!['admin', 'faculty', 'student'].includes(role)) {
    return res.status(400).json({ message: 'role must be admin, faculty, or student' });
  }

  const existing = await User.findOne({ email });
  if (existing) return res.status(400).json({ message: 'Email already registered' });

  const user = await User.create({ name, email, password, role });
  const token = signToken(user._id, user.role);
  res.status(201).json({ accessToken: token, tokenType: 'Bearer', role: user.role, userId: user._id, name: user.name });
});

// POST /auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: 'email and password are required' });

  const user = await User.findOne({ email });
  if (!user || !user.isActive)
    return res.status(401).json({ message: 'Invalid email or password' });

  const ok = await user.comparePassword(password);
  if (!ok) return res.status(401).json({ message: 'Invalid email or password' });

  const token = signToken(user._id, user.role);

  let studentId = null;

  if (user.role === 'student') {
    const student = await Student.findOne({ userId: user._id });

    if (student) {
      studentId = student._id;
    }
  }

  res.json({
    accessToken: token,
    tokenType: 'Bearer',
    role: user.role,
    userId: user._id,
    studentId,
    name: user.name
  });
});

// GET /auth/me
router.get('/me', authenticate, (req, res) => {
  res.json(req.user);
});

module.exports = router;
