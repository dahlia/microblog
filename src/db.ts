import Database from "better-sqlite3";

const db = new Database("microblog.sqlite3");
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

export default db;
