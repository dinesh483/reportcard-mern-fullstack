const mongoose = require('mongoose');

let _conn = null;

const connectDB = async (uri) => {
  const mongoUri = uri || process.env.MONGO_URI || 'mongodb://localhost:27017/reportcard_db';
  if (_conn) return _conn;
  _conn = await mongoose.connect(mongoUri, {
  serverSelectionTimeoutMS: 5000,
});
  console.log(`MongoDB connected: ${mongoose.connection.host}`);
  return _conn;
};

module.exports = { connectDB, mongoose };
