const mongoose = require('mongoose');
const { createModel, generateObjectId } = require('./localStore');

let isMongoConnected = false;

const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/clauseguard_ai';
  try {
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 2500,
    });
    isMongoConnected = true;
    console.log(`[ClauseGuard DB] MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    isMongoConnected = false;
    console.warn(`[ClauseGuard DB] Local MongoDB not detected (${error.message}).`);
    console.log(`[ClauseGuard DB] Seamlessly running with local embedded persistent database.`);
  }
};

mongoose.connection.on('connected', () => {
  isMongoConnected = true;
});

mongoose.connection.on('disconnected', () => {
  isMongoConnected = false;
});

function wrapModel(modelName, mongooseModel) {
  const local = createModel(modelName);

  const HybridModel = function (data) {
    if (isMongoConnected) {
      return new mongooseModel(data);
    }
    return new local.LocalDocument(data);
  };

  const staticMethods = [
    'create',
    'find',
    'findOne',
    'findById',
    'findByIdAndUpdate',
    'findOneAndUpdate',
    'findByIdAndDelete',
    'deleteMany',
    'insertMany'
  ];

  for (const m of staticMethods) {
    HybridModel[m] = function (...args) {
      if (isMongoConnected) {
        return mongooseModel[m](...args);
      }
      return local[m](...args);
    };
  }

  HybridModel.schema = mongooseModel.schema;
  return HybridModel;
}

module.exports = connectDB;
module.exports.connectDB = connectDB;
module.exports.isMongoConnected = () => isMongoConnected;
module.exports.wrapModel = wrapModel;
