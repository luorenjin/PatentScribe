import Database from "@tauri-apps/plugin-sql";
import { Store } from "@tauri-apps/plugin-store";
import { AppSettings, WorkbenchRecord } from "../types/patent";

// --- Configuration Storage (Tauri Store) ---
const SETTINGS_FILE = ".settings.dat";
const store = new Store(SETTINGS_FILE);

export async function loadSettings(): Promise<AppSettings | null> {
  try {
    const saved = await store.get("settings");
    return saved as AppSettings | null;
  } catch (error) {
    console.error("Failed to load settings from Store", error);
    return null;
  }
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  try {
    await store.set("settings", settings);
    await store.save();
  } catch (error) {
    console.error("Failed to save settings to Store", error);
  }
}

// --- Relational Data (SQLite) ---
let db: Database | null = null;

async function getDb() {
  if (db) return db;
  db = await Database.load("sqlite:patent_scribe.db");
  
  // Initialize table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS workbench_records (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      disclosure TEXT NOT NULL,
      diagnosis TEXT NOT NULL
    )
  `);
  
  return db;
}

export async function loadWorkbenchRecords(): Promise<WorkbenchRecord[]> {
  try {
    const database = await getDb();
    const rows = await database.select<any[]>("SELECT * FROM workbench_records ORDER BY timestamp DESC");
    
    return rows.map(row => ({
      ...row,
      disclosure: JSON.parse(row.disclosure),
      diagnosis: JSON.parse(row.diagnosis)
    }));
  } catch (error) {
    console.error("Failed to load workbench records from SQLite", error);
    return [];
  }
}

export async function saveWorkbenchRecord(record: WorkbenchRecord): Promise<void> {
  try {
    const database = await getDb();
    await database.execute(
      "INSERT OR REPLACE INTO workbench_records (id, title, timestamp, disclosure, diagnosis) VALUES ($1, $2, $3, $4, $5)",
      [
        record.id,
        record.title,
        record.timestamp,
        JSON.stringify(record.disclosure),
        JSON.stringify(record.diagnosis)
      ]
    );
  } catch (error) {
    console.error("Failed to save workbench record to SQLite", error);
  }
}

export async function deleteWorkbenchRecord(id: string): Promise<void> {
  try {
    const database = await getDb();
    await database.execute("DELETE FROM workbench_records WHERE id = $1", [id]);
  } catch (error) {
    console.error("Failed to delete workbench record from SQLite", error);
  }
}
