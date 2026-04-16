const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongoServer;

async function connectTestDB() {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();

    // Ensure app-level Mongo/session config uses the same ephemeral test database.
    process.env.MONGO_URI = uri;
    process.env.MONGODB_URI = uri;

    await mongoose.connect(uri);
}

async function disconnectTestDB() {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
    await mongoServer.stop();
}

async function clearCollections() {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        await collections[key].deleteMany({});
    }
}

module.exports = { connectTestDB, disconnectTestDB, clearCollections };
