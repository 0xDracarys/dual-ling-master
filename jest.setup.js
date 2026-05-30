// Optional: configure or set up a testing framework before each test.
// If you delete this file, remove `setupFilesAfterEnv` from `jest.config.js`

// Mock environment variables
process.env.JWT_SECRET = 'test-secret-key'
process.env.MONGODB_URI = 'mongodb://localhost:27017/test'
