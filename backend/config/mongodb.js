const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sportsamigo';

mongoose.connect(MONGODB_URI)
.then(() => {
  console.log('Connected to MongoDB database');
})
.catch((err) => {
  console.error('MongoDB connection error:', err);
});

module.exports = mongoose; 