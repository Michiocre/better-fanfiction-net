import { argv } from 'node:process';
import { map } from 'extra-promise';
import { findMigrationFilenames, readMigrationFile } from 'migration-files';
import { migrate } from '@blackglory/better-sqlite3-migrations';
import Database from 'better-sqlite3';
import 'dotenv/config';
import { existsSync, writeFileSync } from 'fs';

if (!existsSync(process.env.DB_FILE)) {
    writeFileSync(process.env.DB_FILE, "");
}

const db = new Database(process.env.DB_FILE);
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

const filenames = await findMigrationFilenames('./db/migrations');
const migrations = await map(filenames, readMigrationFile);
const version = Number.parseInt(argv[2]);

if (version) {
    migrate(db, migrations, version);
} else {
    migrate(db, migrations);
}