const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'clauseguard_store.json');

function generateObjectId() {
  return crypto.randomBytes(12).toString('hex');
}

class LocalStoreManager {
  constructor() {
    this.data = {
      users: [],
      documents: [],
      clauses: [],
      riskanalyses: [],
      reports: [],
      chathistories: []
    };
    this.loaded = false;
    this.saveTimeout = null;
    this.init();
  }

  init() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf8');
        if (raw.trim()) {
          const parsed = JSON.parse(raw);
          this.data = { ...this.data, ...parsed };
        }
      }
      this.loaded = true;
    } catch (e) {
      console.warn('[LocalStore] Initializing empty store:', e.message);
      this.loaded = true;
    }
  }

  save() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (e) {
      console.error('[LocalStore] Save error:', e.message);
    }
  }

  getCollection(name) {
    const key = name.toLowerCase() + 's';
    if (!this.data[key]) {
      this.data[key] = [];
    }
    return this.data[key];
  }
}

const storeManager = new LocalStoreManager();

function matchQuery(item, query = {}) {
  if (!query || Object.keys(query).length === 0) return true;
  for (const [key, val] of Object.entries(query)) {
    if (key === '$or' && Array.isArray(val)) {
      const orMatched = val.some(subQ => matchQuery(item, subQ));
      if (!orMatched) return false;
      continue;
    }
    const itemVal = item[key];
    const strItemVal = itemVal !== undefined && itemVal !== null ? itemVal.toString() : undefined;
    const strQueryVal = val !== undefined && val !== null ? val.toString() : undefined;

    if (val && typeof val === 'object' && !Array.isArray(val)) {
      if (val.$in && Array.isArray(val.$in)) {
        const inMatched = val.$in.some(v => v.toString() === strItemVal);
        if (!inMatched) return false;
        continue;
      }
      if (val.$ne !== undefined) {
        if (strItemVal === val.$ne.toString()) return false;
        continue;
      }
    }

    if (strItemVal !== strQueryVal) {
      return false;
    }
  }
  return true;
}

class QueryWrapper {
  constructor(resultPromise, collectionName) {
    this.resultPromise = resultPromise;
    this.collectionName = collectionName;
    this.selectField = null;
    this.sortCriteria = null;
  }

  select(fields) {
    this.selectField = fields;
    return this;
  }

  sort(criteria) {
    this.sortCriteria = criteria;
    return this;
  }

  async exec() {
    let result = await this.resultPromise;
    if (Array.isArray(result) && this.sortCriteria) {
      result.sort((a, b) => {
        for (const [key, dir] of Object.entries(this.sortCriteria)) {
          const valA = a[key] !== undefined ? a[key] : 0;
          const valB = b[key] !== undefined ? b[key] : 0;
          if (valA < valB) return dir === -1 ? 1 : -1;
          if (valA > valB) return dir === -1 ? -1 : 1;
        }
        return 0;
      });
    }

    if (this.collectionName === 'user') {
      if (Array.isArray(result)) {
        return result.map(u => this.formatUser(u, this.selectField));
      } else if (result) {
        return this.formatUser(result, this.selectField);
      }
    }

    return result;
  }

  formatUser(user, selectField) {
    if (!user) return null;
    const clone = { ...user };
    if (!selectField || !selectField.includes('+password')) {
      delete clone.password;
    }
    clone.matchPassword = async function(enteredPassword) {
      return await bcrypt.compare(enteredPassword, user.password);
    };
    clone.save = async function() {
      storeManager.save();
      return clone;
    };
    return clone;
  }

  then(resolve, reject) {
    return this.exec().then(resolve, reject);
  }
}

function createModel(modelName) {
  const collectionKey = modelName.toLowerCase() + 's';

  class LocalDocument {
    constructor(data = {}) {
      Object.assign(this, data);
      if (!this._id) {
        this._id = generateObjectId();
      }
      if (!this.createdAt) {
        this.createdAt = new Date();
      }
      this.updatedAt = new Date();
    }

    async save() {
      const coll = storeManager.getCollection(modelName);
      if (modelName.toLowerCase() === 'user' && this.password && !this.password.startsWith('$2a$') && !this.password.startsWith('$2b$')) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
      }
      const existingIdx = coll.findIndex(item => item._id.toString() === this._id.toString());
      if (existingIdx >= 0) {
        coll[existingIdx] = { ...this, updatedAt: new Date() };
      } else {
        coll.push(this);
      }
      storeManager.save();
      return this;
    }
  }

  return {
    LocalDocument,
    async create(data) {
      const coll = storeManager.getCollection(modelName);
      const isArray = Array.isArray(data);
      const items = isArray ? data : [data];
      const createdItems = [];

      for (const item of items) {
        const instance = new LocalDocument(item);
        if (modelName.toLowerCase() === 'user' && instance.password) {
          const salt = await bcrypt.genSalt(10);
          instance.password = await bcrypt.hash(instance.password, salt);
        }
        coll.push(instance);
        createdItems.push(instance);
      }
      storeManager.save();

      if (modelName.toLowerCase() === 'user') {
        const wrap = (u) => {
          const copy = { ...u };
          copy.matchPassword = async (p) => bcrypt.compare(p, u.password);
          copy.save = async () => { storeManager.save(); return copy; };
          return copy;
        };
        return isArray ? createdItems.map(wrap) : wrap(createdItems[0]);
      }

      return isArray ? createdItems : createdItems[0];
    },

    find(query = {}) {
      const promise = (async () => {
        const coll = storeManager.getCollection(modelName);
        return coll.filter(item => matchQuery(item, query)).map(i => {
          const item = { ...i };
          item.save = async () => {
            const idx = coll.findIndex(c => c._id.toString() === item._id.toString());
            if (idx >= 0) coll[idx] = { ...item, updatedAt: new Date() };
            storeManager.save();
            return item;
          };
          return item;
        });
      })();
      return new QueryWrapper(promise, modelName.toLowerCase());
    },

    findOne(query = {}) {
      const promise = (async () => {
        const coll = storeManager.getCollection(modelName);
        const item = coll.find(i => matchQuery(i, query));
        if (!item) return null;
        const copy = { ...item };
        copy.save = async () => {
          const idx = coll.findIndex(c => c._id.toString() === copy._id.toString());
          if (idx >= 0) coll[idx] = { ...copy, updatedAt: new Date() };
          storeManager.save();
          return copy;
        };
        return copy;
      })();
      return new QueryWrapper(promise, modelName.toLowerCase());
    },

    findById(id) {
      return this.findOne({ _id: id });
    },

    async findByIdAndUpdate(id, update, options = {}) {
      const coll = storeManager.getCollection(modelName);
      const strId = id ? id.toString() : '';
      const idx = coll.findIndex(i => i._id.toString() === strId);
      if (idx >= 0) {
        const updated = {
          ...coll[idx],
          ...update,
          updatedAt: new Date()
        };
        coll[idx] = updated;
        storeManager.save();
        return updated;
      }
      if (options.upsert) {
        return this.create({ _id: id, ...update });
      }
      return null;
    },

    async findOneAndUpdate(query, update, options = {}) {
      const coll = storeManager.getCollection(modelName);
      const idx = coll.findIndex(i => matchQuery(i, query));
      if (idx >= 0) {
        const updated = {
          ...coll[idx],
          ...update,
          updatedAt: new Date()
        };
        coll[idx] = updated;
        storeManager.save();
        return updated;
      }
      if (options.upsert) {
        return this.create({ ...query, ...update });
      }
      return null;
    },

    async findByIdAndDelete(id) {
      const coll = storeManager.getCollection(modelName);
      const strId = id ? id.toString() : '';
      const idx = coll.findIndex(i => i._id.toString() === strId);
      if (idx >= 0) {
        const [removed] = coll.splice(idx, 1);
        storeManager.save();
        return removed;
      }
      return null;
    },

    async deleteMany(query = {}) {
      const coll = storeManager.getCollection(modelName);
      const initialLen = coll.length;
      const remaining = coll.filter(item => !matchQuery(item, query));
      storeManager.data[collectionKey] = remaining;
      storeManager.save();
      return { deletedCount: initialLen - remaining.length };
    },

    async insertMany(docs = []) {
      const coll = storeManager.getCollection(modelName);
      const inserted = [];
      for (const d of docs) {
        const item = {
          ...d,
          _id: d._id || generateObjectId(),
          createdAt: d.createdAt || new Date(),
          updatedAt: new Date()
        };
        coll.push(item);
        inserted.push(item);
      }
      storeManager.save();
      return inserted;
    }
  };
}

module.exports = {
  LocalStoreManager,
  storeManager,
  createModel,
  generateObjectId
};
