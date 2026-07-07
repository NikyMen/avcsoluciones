import { randomBytes, scryptSync } from 'node:crypto';
import { mkdir, readFile, rename, stat, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { fileURLToPath } from 'node:url';
import { loadEnv } from './env.mjs';

const rootDir = resolve(fileURLToPath(new URL('..', import.meta.url)));
await loadEnv(join(rootDir, '.env'));

const dataDir = resolve(process.env.DATA_DIR || join(rootDir, 'data'));
const uploadDir = resolve(process.env.UPLOAD_DIR || join(dataDir, 'uploads'));
const dbPath = resolve(process.env.DB_PATH || join(dataDir, 'db.json'));

const defaultDb = {
  users: [],
  sessions: [],
  cvs: [],
  settings: {},
};

const ensureStorage = async () => {
  await mkdir(uploadDir, { recursive: true });
  try {
    await stat(dbPath);
  } catch {
    await writeDb(defaultDb);
  }
};

const readDb = async () => {
  await ensureStorage();
  return { ...defaultDb, ...JSON.parse(await readFile(dbPath, 'utf8')) };
};

const writeDb = async (db) => {
  await mkdir(dataDir, { recursive: true });
  const tmpPath = `${dbPath}.${process.pid}.${Date.now()}.tmp`;
  await writeFile(tmpPath, `${JSON.stringify(db, null, 2)}\n`);
  await rename(tmpPath, dbPath);
};

const hashPassword = (password) => {
  const salt = randomBytes(16).toString('base64url');
  const hash = scryptSync(password, salt, 64).toString('base64url');
  return `scrypt:${salt}:${hash}`;
};

const args = Object.fromEntries(
  process.argv.slice(2).map((arg) => {
    const [key, ...value] = arg.replace(/^--/, '').split('=');
    return [key, value.join('=') || true];
  })
);

const rl = createInterface({ input, output });
const ask = async (key, label, hidden = false) => {
  if (args[key] && args[key] !== true) return String(args[key]);
  if (!hidden) return rl.question(`${label}: `);
  const value = await rl.question(`${label}: `);
  return value;
};

const username = (await ask('username', 'Usuario')).trim();
const name = (await ask('name', 'Nombre visible')).trim() || username;
const password = await ask('password', 'Contrasena');
rl.close();

if (!username || !password || password.length < 8) {
  console.error('El usuario es obligatorio y la contrasena debe tener al menos 8 caracteres.');
  process.exit(1);
}

const db = await readDb();
const existing = db.users.find((user) => user.username.toLowerCase() === username.toLowerCase());
const nextUser = {
  id: existing?.id || randomBytes(12).toString('hex'),
  username,
  name,
  role: 'admin',
  passwordHash: hashPassword(password),
  createdAt: existing?.createdAt || new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

if (existing) {
  Object.assign(existing, nextUser);
  db.sessions = db.sessions.filter((session) => session.userId !== existing.id);
} else {
  db.users.push(nextUser);
}

await writeDb(db);
console.log(existing ? `Usuario actualizado: ${username}` : `Usuario creado: ${username}`);
