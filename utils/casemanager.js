const { MongoClient } = require('mongodb');
const uri = process.env.MONGO_URI || 'mongodb://localhost:27017';
const dbName = 'moderation';
const collectionName = 'cases';

class CaseManager {
  constructor() {
    this.client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    this.client.connect()
      .then(() => {
        console.log('Connected to MongoDB');
        this.db = this.client.db(dbName);
        this.casesCollection = this.db.collection(collectionName);
        this.warningsCollection = this.db.collection('warnings');
      })
      .catch(err => {
        console.error('Error connecting to MongoDB:', err);
      });
  }

  async saveCases() {
  }

  async createCase(user, moderator, command, reason) {
    const newCase = {
      user,
      moderator,
      command,
      timestamp: new Date().toISOString(),
      reason,
    };
    try {
      const result = await this.casesCollection.insertOne(newCase);
      console.log('Case created successfully:', result.insertedId);
      return result.insertedId;
    } catch (error) {
      console.error('Error creating case:', error);
      throw error;
    }
  }

  async getCasesByUser(user) {
    try {
      const cases = await this.casesCollection.find({ user }).toArray();
      return cases;
    } catch (error) {
      console.error('Error retrieving cases for user:', error);
      throw error;
    }
  }

  async getAllCases() {
    try {
      const cases = await this.casesCollection.find().toArray();
      return cases;
    } catch (error) {
      console.error('Error retrieving all cases:', error);
      throw error;
    }
  }

  async addWarning(userId, reason) {
    const warning = {
      userId,
      reason,
      date: new Date().toISOString(),
    };
    try {
      const result = await this.warningsCollection.insertOne(warning);
      console.log('Warning added successfully:', result.insertedId);
      return result.insertedId;
    } catch (error) {
      console.error('Error adding warning:', error);
      throw error;
    }
  }

  async clearWarnings(userId) {
    try {
      const result = await this.warningsCollection.deleteMany({ userId });
      return result;
    } catch (error) {
      console.error('Error clearing warnings:', error);
      throw error;
    }
  }

  async getWarnings(userId) {
    try {
      const warnings = await this.warningsCollection.find({ userId }).toArray();
      return warnings;
    } catch (error) {
      console.error('Error retrieving warnings:', error);
      throw error;
    }
  }
}

const caseManager = new CaseManager();
module.exports = caseManager;
