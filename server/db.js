const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs   = require('fs');

let db;

function getDb() {
  if (db) return db;

  const dbPath = process.env.DB_PATH || path.join(__dirname, 'data', 'InvenSight.db');
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });

  db = new DatabaseSync(dbPath);
  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id                 TEXT PRIMARY KEY,
      name               TEXT NOT NULL,
      email              TEXT NOT NULL UNIQUE,
      username           TEXT UNIQUE,
      password_hash      TEXT,
      role               TEXT NOT NULL CHECK(role IN ('operational','analytical','management')),
      status             TEXT NOT NULL DEFAULT 'invited'
                         CHECK(status IN ('invited','active','deactivated')),
      warehouse          TEXT,
      department         TEXT,
      business_name      TEXT,
      business_reg       TEXT,
      phone              TEXT,
      invite_token       TEXT UNIQUE,
      invite_expires_at  INTEGER,
      reset_token        TEXT UNIQUE,
      reset_expires_at   INTEGER,
      created_at         INTEGER NOT NULL DEFAULT (unixepoch()),
      created_by         TEXT REFERENCES users(id),
      last_login_at      INTEGER
    );

    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id          TEXT PRIMARY KEY,
      user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash  TEXT NOT NULL UNIQUE,
      expires_at  INTEGER NOT NULL,
      created_at  INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS audit_log (
      id         TEXT PRIMARY KEY,
      user_id    TEXT,
      action     TEXT NOT NULL,
      target_id  TEXT,
      details    TEXT,
      ip         TEXT,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    );
  `);

  return db;
}

module.exports = { getDb };
