const mongoose = require('mongoose');

// MongoDB connection URL - update with your MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sportsamigo';

// Connect to MongoDB
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('Connected to MongoDB database');
})
.catch((err) => {
  console.error('MongoDB connection error:', err);
});

// Export mongoose instance
module.exports = mongoose; 