import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, 'auction_db.json');

class RoomDatabase {
  constructor() {
    this.rooms = new Map();
    this.loadFromDisk();
  }

  loadFromDisk() {
    try {
      if (fs.existsSync(DB_PATH)) {
        const raw = fs.readFileSync(DB_PATH, 'utf-8');
        const data = JSON.parse(raw);
        if (data && typeof data === 'object') {
          for (const [code, roomBundle] of Object.entries(data)) {
            this.rooms.set(code.toUpperCase(), roomBundle);
          }
          printLog(`Loaded ${this.rooms.size} active rooms from persistent database.`);
        }
      }
    } catch (err) {
      console.error('Failed to load database from disk:', err);
    }
  }

  saveToDisk() {
    try {
      const obj = {};
      for (const [code, roomBundle] of this.rooms.entries()) {
        obj[code] = roomBundle;
      }
      fs.writeFileSync(DB_PATH, JSON.stringify(obj, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to save database to disk:', err);
    }
  }

  getRoom(code) {
    if (!code) return null;
    return this.rooms.get(code.trim().toUpperCase()) || null;
  }

  saveRoom(code, bundle) {
    if (!code || !bundle) return;
    this.rooms.set(code.trim().toUpperCase(), bundle);
    this.saveToDisk();
  }

  deleteRoom(code) {
    if (!code) return;
    this.rooms.delete(code.trim().toUpperCase());
    this.saveToDisk();
  }
}

function printLog(msg) {
  console.log(`[IPL-DB ${new Date().toISOString()}] ${msg}`);
}

export const db = new RoomDatabase();
