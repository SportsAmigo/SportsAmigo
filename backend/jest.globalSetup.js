/**
 * Jest globalSetup — starts ONE MongoMemoryServer for the entire test suite.
 * The URI is stored in process.env so all test files can connect to it.
 */
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

module.exports = async function () {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();

    process.env.MONGO_URI = uri;
    process.env.MONGODB_URI = uri;
    // Store on global so globalTeardown can stop it
    global.__MONGO_SERVER__ = mongoServer;
    // Write to env so jest worker threads can read it
    process.env.__MONGO_URI__ = uri;
};
