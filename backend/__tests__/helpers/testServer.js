/**
 * testServer.js — uses the single MongoMemoryServer started by globalSetup.
 * Each test file calls connectTestDB / disconnectTestDB in beforeAll / afterAll.
 */
const mongoose = require('mongoose');

async function connectTestDB() {
    // URI was set by jest.globalSetup.js
    const uri = process.env.MONGO_URI || process.env.__MONGO_URI__;
    if (!uri) throw new Error('[testServer] MONGO_URI not set — is jest.globalSetup.js configured?');

    if (mongoose.connection.readyState === 0) {
        await mongoose.connect(uri);
    }
}

async function disconnectTestDB() {
    // Drop all collections between test suites (not the entire DB) to stay isolated
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        await collections[key].deleteMany({});
    }
    // Do NOT call mongoose.disconnect() or mongoServer.stop() here —
    // globalTeardown handles that after all suites are done.
}

async function clearCollections() {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        await collections[key].deleteMany({});
    }
}

module.exports = { connectTestDB, disconnectTestDB, clearCollections };
