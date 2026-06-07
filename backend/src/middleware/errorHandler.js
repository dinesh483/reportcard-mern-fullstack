function errorHandler(err, req, res, next) {
  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return res.status(400).json({ message: `Duplicate value for ${field}` });
  }
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(422).json({ message: messages.join('; ') });
  }
  // JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }

  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    message: err.message || 'Internal server error',
    ...(err.data ? { data: err.data } : {}),
  });
}

module.exports = errorHandler;
