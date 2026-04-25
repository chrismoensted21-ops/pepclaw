import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

let db: Database.Database | null = null;

function resolveDbPath(): string {
  const fromEnv = process.env.PEPCLAW_DB_PATH;
  if (fromEnv && fromEnv.trim().length > 0) return path.resolve(fromEnv);
  return path.resolve(process.cwd(), ".data", "pepclaw.db");
}

export function getDb(): Database.Database {
  if (db) return db;
  const dbPath = resolveDbPath();
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  initSchema(db);
  return db;
}

function initSchema(database: Database.Database): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS missions (
      id TEXT PRIMARY KEY,
      query TEXT NOT NULL,
      target_class TEXT,
      depth TEXT NOT NULL DEFAULT 'standard',
      status TEXT NOT NULL DEFAULT 'queued',
      budget_cents INTEGER NOT NULL DEFAULT 800,
      spent_cents INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      started_at TEXT,
      completed_at TEXT,
      failure_reason TEXT,
      commit_hash TEXT,
      commit_salt TEXT,
      revealed_at TEXT
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      mission_id TEXT NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
      pool TEXT NOT NULL,
      agent_index INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'queued',
      input TEXT,
      output TEXT,
      error TEXT,
      started_at TEXT,
      completed_at TEXT,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS tasks_mission_idx ON tasks(mission_id);
    CREATE INDEX IF NOT EXISTS tasks_pool_idx ON tasks(pool);
    CREATE INDEX IF NOT EXISTS tasks_status_idx ON tasks(status);

    CREATE TABLE IF NOT EXISTS findings (
      id TEXT PRIMARY KEY,
      mission_id TEXT NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
      task_id TEXT REFERENCES tasks(id) ON DELETE SET NULL,
      pool TEXT NOT NULL,
      source_type TEXT NOT NULL,
      source_ref TEXT NOT NULL,
      title TEXT,
      content TEXT NOT NULL,
      url TEXT,
      relevance_score REAL,
      evidence_grade TEXT,
      target TEXT,
      metadata TEXT,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS findings_mission_idx ON findings(mission_id);
    CREATE INDEX IF NOT EXISTS findings_grade_idx ON findings(evidence_grade);

    CREATE TABLE IF NOT EXISTS theses (
      id TEXT PRIMARY KEY,
      mission_id TEXT NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      hypothesis TEXT NOT NULL,
      mechanism TEXT,
      target TEXT,
      evidence_summary TEXT,
      conviction REAL,
      evidence_grade TEXT,
      status TEXT NOT NULL DEFAULT 'draft',
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS theses_mission_idx ON theses(mission_id);

    CREATE TABLE IF NOT EXISTS critiques (
      id TEXT PRIMARY KEY,
      mission_id TEXT NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
      thesis_id TEXT REFERENCES theses(id) ON DELETE SET NULL,
      persona TEXT NOT NULL,
      severity TEXT NOT NULL,
      category TEXT,
      specific_concern TEXT NOT NULL,
      suggested_fix TEXT,
      blocks INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS critiques_mission_idx ON critiques(mission_id);

    CREATE TABLE IF NOT EXISTS dossiers (
      id TEXT PRIMARY KEY,
      mission_id TEXT NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      content_chars INTEGER NOT NULL,
      doc_type TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS dossiers_mission_idx ON dossiers(mission_id);

    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mission_id TEXT,
      kind TEXT NOT NULL,
      pool TEXT,
      payload TEXT,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS events_mission_idx ON events(mission_id);
    CREATE INDEX IF NOT EXISTS events_id_idx ON events(id);
  `);
}

export function txn<T>(fn: (db: Database.Database) => T): T {
  const database = getDb();
  const tx = database.transaction(fn);
  return tx(database);
}
