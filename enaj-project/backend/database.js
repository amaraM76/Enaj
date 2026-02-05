const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'enaj.db');

let db = null;

async function initDatabase() {
  const SQL = await initSqlJs();
  
  // Load existing database or create new one
  try {
    if (fs.existsSync(dbPath)) {
      const fileBuffer = fs.readFileSync(dbPath);
      db = new SQL.Database(fileBuffer);
      console.log('📂 Loaded existing database');
    } else {
      db = new SQL.Database();
      console.log('✨ Created new database');
    }
  } catch (e) {
    db = new SQL.Database();
    console.log('✨ Created new database (fresh start)');
  }

  // Create tables
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE,
      password_hash TEXT,
      name TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS user_ailments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      ailment_name TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, ailment_name)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS user_preferences (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      preference_name TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, preference_name)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS removed_ingredients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      ailment_name TEXT NOT NULL,
      ingredient_name TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, ailment_name, ingredient_name)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS custom_ailments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      ailment_text TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS scan_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      product_name TEXT NOT NULL,
      product_brand TEXT,
      product_price TEXT,
      flagged_ingredients TEXT,
      is_recommended INTEGER DEFAULT 0,
      scanned_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS saved_alternatives (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      product_name TEXT NOT NULL,
      product_brand TEXT,
      product_price TEXT,
      product_link TEXT,
      product_rating REAL,
      saved_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  saveDatabase();
  console.log('✅ Database tables initialized');
  
  return db;
}

function saveDatabase() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  }
}

function getDb() {
  return db;
}

// Helper functions to match better-sqlite3 API style
function run(sql, params = []) {
  try {
    db.run(sql, params);
    saveDatabase();
    return { changes: db.getRowsModified() };
  } catch (e) {
    console.error('SQL Error:', e.message);
    throw e;
  }
}

function get(sql, params = []) {
  try {
    const stmt = db.prepare(sql);
    stmt.bind(params);
    if (stmt.step()) {
      const row = stmt.getAsObject();
      stmt.free();
      return row;
    }
    stmt.free();
    return null;
  } catch (e) {
    console.error('SQL Error:', e.message);
    throw e;
  }
}

function all(sql, params = []) {
  try {
    const stmt = db.prepare(sql);
    stmt.bind(params);
    const rows = [];
    while (stmt.step()) {
      rows.push(stmt.getAsObject());
    }
    stmt.free();
    return rows;
  } catch (e) {
    console.error('SQL Error:', e.message);
    throw e;
  }
}

module.exports = {
  initDatabase,
  getDb,
  saveDatabase,
  run,
  get,
  all
};