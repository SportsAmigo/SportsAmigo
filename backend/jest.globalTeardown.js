/**
 * Jest globalTeardown — stops the MongoMemoryServer after all tests complete.
 */
module.exports = async function () {
    if (global.__MONGO_SERVER__) {
        await global.__MONGO_SERVER__.stop();
    }
};
