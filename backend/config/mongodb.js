const mongoose = require('mongoose');

const isProduction = process.env.NODE_ENV === 'production';
const MONGODB_URI =
  process.env.MONGO_URI ||
  process.env.MONGODB_URI ||
  (isProduction ? '' : 'mongodb://localhost:27017/sportsamigo');

if (!MONGODB_URI) {
  console.error('MongoDB URI is missing. Set MONGO_URI or MONGODB_URI.');
  process.exit(1);
}

mongoose.connect(MONGODB_URI)
.then(() => {
  console.log('Connected to MongoDB database');
})
.catch((err) => {
  console.error('MongoDB connection error:', err);
});

module.exports = mongoose; 