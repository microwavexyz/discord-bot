const { MongoClient } = require('mongodb');

class CaseManager {
  constructor(config = {}) {
    this.uri = config.uri || process.env.MONGO_URI || 'mongodb://localhost:27017';
    this.dbName = config.dbName || 'moderation';
    this.client = null;
    this.db = null;
    this.collections = {};
    this.isConnected = false;
  }

  async connect() {
    if (this.isConnected) return;

    try {
      this.client = new MongoClient(this.uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000
      });

      await this.client.connect();
      this.db = this.client.db(this.dbName);
      this.collections = {
        cases: this.db.collection('cases'),
        warnings: this.db.collection('warnings')
      };
      this.isConnected = true;
      console.log('Connected to MongoDB');
    } catch (err) {
      console.error('Error connecting to MongoDB:', err);
      throw new Error('Failed to connect to the database');
    }
  }

  async createCase(caseData) {
    await this.ensureConnection();
    const { user, moderator, command, reason } = caseData;
    
    if (!user || !moderator || !command || !reason) {
      throw new Error('Missing required case information');
    }

    const newCase = {
      user,
      moderator,
      command,
      reason,
      timestamp: new Date(),
      status: 'open'
    };

    const result = await this.collections.cases.insertOne(newCase);
    console.log('Case created successfully:', result.insertedId);
    return result.insertedId;
  }

  async getCasesByUser(user, options = {}) {
    await this.ensureConnection();
    const query = { user };
    const sort = options.sort || { timestamp: -1 };
    const limit = options.limit || 0;

    return this.collections.cases.find(query).sort(sort).limit(limit).toArray();
  }

  async getAllCases(options = {}) {
    await this.ensureConnection();
    const query = options.query || {};
    const sort = options.sort || { timestamp: -1 };
    const limit = options.limit || 0;
    const skip = options.skip || 0;

    return this.collections.cases.find(query).sort(sort).skip(skip).limit(limit).toArray();
  }

  async updateCaseStatus(caseId, newStatus) {
    await this.ensureConnection();
    const result = await this.collections.cases.updateOne(
      { _id: caseId },
      { $set: { status: newStatus, updatedAt: new Date() } }
    );
    return result.modifiedCount === 1;
  }

  async addWarning(warningData) {
    await this.ensureConnection();
    const { userId, reason, moderator } = warningData;

    if (!userId || !reason || !moderator) {
      throw new Error('Missing required warning information');
    }

    const warning = {
      userId,
      reason,
      moderator,
      date: new Date(),
      acknowledged: false
    };

    const result = await this.collections.warnings.insertOne(warning);
    console.log('Warning added successfully:', result.insertedId);
    return result.insertedId;
  }

  async acknowledgeWarning(warningId) {
    await this.ensureConnection();
    const result = await this.collections.warnings.updateOne(
      { _id: warningId },
      { $set: { acknowledged: true, acknowledgedAt: new Date() } }
    );
    return result.modifiedCount === 1;
  }

  async clearWarnings(userId) {
    await this.ensureConnection();
    const result = await this.collections.warnings.deleteMany({ userId });
    console.log(`Cleared ${result.deletedCount} warnings for user ${userId}`);
    return result.deletedCount;
  }

  async getWarnings(userId, options = {}) {
    await this.ensureConnection();
    const query = { userId };
    const sort = options.sort || { date: -1 };
    const limit = options.limit || 0;

    return this.collections.warnings.find(query).sort(sort).limit(limit).toArray();
  }

  async getWarningCount(userId) {
    await this.ensureConnection();
    return this.collections.warnings.countDocuments({ userId });
  }

  async disconnect() {
    if (this.isConnected) {
      await this.client.close();
      this.client = null;
      this.db = null;
      this.collections = {};
      this.isConnected = false;
      console.log('Disconnected from MongoDB');
    }
  }

  async ensureConnection() {
    if (!this.isConnected) {
      await this.connect();
    }
  }
}

module.exports = CaseManager;
