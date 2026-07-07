import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { mkdir, readFile, rename, rm, stat, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEnv } from './env.mjs';

const rootDir = resolve(fileURLToPath(new URL('..', import.meta.url)));
await loadEnv(join(rootDir, '.env'));

const distDir = resolve(process.env.STATIC_DIR || join(rootDir, 'dist'));
const dataDir = resolve(process.env.DATA_DIR || join(rootDir, 'data'));
const uploadDir = resolve(process.env.UPLOAD_DIR || join(dataDir, 'uploads'));
const dbPath = resolve(process.env.DB_PATH || join(dataDir, 'db.json'));
const port = Number(process.env.PORT || 3000);
const sessionSecret = process.env.SESSION_SECRET || '';
const cookieName = 'avc_session';
const maxUploadBytes = Number(process.env.MAX_UPLOAD_MB || 10) * 1024 * 1024;
const allowedMimeTypes = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);
const allowedExtensions = new Set(['.pdf', '.doc', '.docx']);

if (!sessionSecret || sessionSecret.length < 32) {
  console.error('Falta SESSION_SECRET o es demasiado corto. Usa al menos 32 caracteres.');
  process.exit(1);
}

const defaultDb = {
  users: [],
  sessions: [],
  cvs: [],
  settings: {},
};

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.pdf': 'application/pdf',
};

const ensureStorage = async () => {
  await mkdir(uploadDir, { recursive: true });
  try {
    await stat(dbPath);
  } catch {
    await writeJsonFile(dbPath, defaultDb);
  }
};

const writeJsonFile = async (filePath, value) => {
  await mkdir(resolve(filePath, '..'), { recursive: true });
  const tmpPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  await writeFile(tmpPath, `${JSON.stringify(value, null, 2)}\n`);
  await rename(tmpPath, filePath);
};

const readDb = async () => {
  await ensureStorage();
  const raw = await readFile(dbPath, 'utf8');
  return { ...defaultDb, ...JSON.parse(raw) };
};

const writeDb = (db) => writeJsonFile(dbPath, db);

const jsonResponse = (res, status, payload, headers = {}) => {
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    ...headers,
  });
  res.end(JSON.stringify(payload));
};

const errorResponse = (res, status, message) => jsonResponse(res, status, { error: message });

const readBody = (req, limit = 1024 * 1024) =>
  new Promise((resolveBody, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > limit) {
        reject(Object.assign(new Error('Payload demasiado grande'), { status: 413 }));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolveBody(Buffer.concat(chunks)));
    req.on('error', reject);
  });

const parseJsonBody = async (req) => {
  const body = await readBody(req);
  if (!body.length) return {};
  return JSON.parse(body.toString('utf8'));
};

const parseCookies = (req) =>
  Object.fromEntries(
    String(req.headers.cookie || '')
      .split(';')
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const index = part.indexOf('=');
        return [part.slice(0, index), decodeURIComponent(part.slice(index + 1))];
      })
  );

const sign = (value) => createHmac('sha256', sessionSecret).update(value).digest('base64url');

const makeSessionCookie = (token, maxAgeSeconds) => {
  const value = `${token}.${sign(token)}`;
  const attrs = [
    `${cookieName}=${encodeURIComponent(value)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${maxAgeSeconds}`,
  ];
  if (process.env.NODE_ENV === 'production') attrs.push('Secure');
  return attrs.join('; ');
};

const clearSessionCookie = () => `${cookieName}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;

const getSignedSessionToken = (req) => {
  const cookie = parseCookies(req)[cookieName];
  if (!cookie) return null;
  const [token, signature] = cookie.split('.');
  if (!token || !signature) return null;
  const expected = sign(token);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return token;
};

const hashPassword = (password) => {
  const salt = randomBytes(16).toString('base64url');
  const hash = scryptSync(password, salt, 64).toString('base64url');
  return `scrypt:${salt}:${hash}`;
};

const verifyPassword = (password, stored) => {
  const [scheme, salt, hash] = String(stored || '').split(':');
  if (scheme !== 'scrypt' || !salt || !hash) return false;
  const actual = Buffer.from(scryptSync(password, salt, 64).toString('base64url'));
  const expected = Buffer.from(hash);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
};

const publicUser = (user) => ({
  id: user.id,
  username: user.username,
  name: user.name || user.username,
  role: user.role || 'admin',
});

const authenticate = async (req) => {
  const token = getSignedSessionToken(req);
  if (!token) return null;
  const db = await readDb();
  const now = Date.now();
  const session = db.sessions.find((item) => item.token === token && new Date(item.expiresAt).getTime() > now);
  if (!session) return null;
  const user = db.users.find((item) => item.id === session.userId);
  if (!user) return null;
  return { db, session, user };
};

const requireAuth = async (req, res) => {
  const auth = await authenticate(req);
  if (!auth) {
    errorResponse(res, 401, 'No autenticado');
    return null;
  }
  return auth;
};

const serializeCv = async (cv, includePreview = false) => {
  const result = {
    id: cv.id,
    serviceId: cv.serviceId,
    name: cv.originalName,
    size: cv.size,
    type: cv.mimeType,
    uploadedAt: cv.uploadedAt,
    uploadedBy: cv.uploadedBy,
    url: `/uploads/${encodeURIComponent(cv.storedName)}`,
  };

  if (includePreview && cv.mimeType === 'application/pdf' && cv.size <= 2 * 1024 * 1024) {
    try {
      const buffer = await readFile(join(uploadDir, cv.storedName));
      result.previewDataUrl = `data:${cv.mimeType};base64,${buffer.toString('base64')}`;
    } catch {
      result.previewDataUrl = '';
    }
  }

  return result;
};

const groupCvsByService = async (cvs, includePreview = false) => {
  const grouped = {};
  for (const cv of cvs) {
    grouped[cv.serviceId] ||= [];
    grouped[cv.serviceId].push(await serializeCv(cv, includePreview));
  }
  return grouped;
};

const sanitizeFilename = (name) =>
  String(name || 'cv')
    .normalize('NFKD')
    .replace(/[^\w.\-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 120) || 'cv';

const parseMultipart = (buffer, contentType) => {
  const boundaryMatch = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(contentType || '');
  const boundary = boundaryMatch?.[1] || boundaryMatch?.[2];
  if (!boundary) throw Object.assign(new Error('Formulario invalido'), { status: 400 });

  const delimiter = Buffer.from(`--${boundary}`);
  const parts = [];
  let cursor = buffer.indexOf(delimiter);

  while (cursor !== -1) {
    cursor += delimiter.length;
    if (buffer[cursor] === 45 && buffer[cursor + 1] === 45) break;
    if (buffer[cursor] === 13 && buffer[cursor + 1] === 10) cursor += 2;

    const headerEnd = buffer.indexOf(Buffer.from('\r\n\r\n'), cursor);
    if (headerEnd === -1) break;
    const headersRaw = buffer.slice(cursor, headerEnd).toString('utf8');
    let next = buffer.indexOf(delimiter, headerEnd + 4);
    if (next === -1) break;
    let content = buffer.slice(headerEnd + 4, next);
    if (content.length >= 2 && content.at(-2) === 13 && content.at(-1) === 10) content = content.slice(0, -2);

    const disposition = /content-disposition:\s*form-data;\s*([^\r\n]+)/i.exec(headersRaw)?.[1] || '';
    const name = /name="([^"]+)"/i.exec(disposition)?.[1] || '';
    const filename = /filename="([^"]*)"/i.exec(disposition)?.[1] || '';
    const contentTypeHeader = /content-type:\s*([^\r\n]+)/i.exec(headersRaw)?.[1]?.trim() || 'application/octet-stream';
    parts.push({ name, filename, contentType: contentTypeHeader, content });
    cursor = next;
  }

  return parts;
};

const handleApi = async (req, res, url) => {
  if (url.pathname === '/api/health') {
    jsonResponse(res, 200, { ok: true });
    return;
  }

  if (url.pathname === '/api/auth/login' && req.method === 'POST') {
    const { username, password } = await parseJsonBody(req);
    const db = await readDb();
    const user = db.users.find((item) => item.username.toLowerCase() === String(username || '').trim().toLowerCase());
    if (!user || !verifyPassword(String(password || ''), user.passwordHash)) {
      errorResponse(res, 401, 'Usuario o contrasena incorrectos');
      return;
    }

    const token = randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString();
    db.sessions = db.sessions.filter((item) => new Date(item.expiresAt).getTime() > Date.now());
    db.sessions.push({ token, userId: user.id, createdAt: new Date().toISOString(), expiresAt });
    await writeDb(db);
    jsonResponse(res, 200, { user: publicUser(user) }, { 'set-cookie': makeSessionCookie(token, 60 * 60 * 24 * 7) });
    return;
  }

  if (url.pathname === '/api/auth/logout' && req.method === 'POST') {
    const token = getSignedSessionToken(req);
    if (token) {
      const db = await readDb();
      db.sessions = db.sessions.filter((item) => item.token !== token);
      await writeDb(db);
    }
    jsonResponse(res, 200, { ok: true }, { 'set-cookie': clearSessionCookie() });
    return;
  }

  if (url.pathname === '/api/auth/me' && req.method === 'GET') {
    const auth = await authenticate(req);
    if (!auth) {
      errorResponse(res, 401, 'No autenticado');
      return;
    }
    jsonResponse(res, 200, { user: publicUser(auth.user) });
    return;
  }

  if (url.pathname === '/api/cvs' && req.method === 'GET') {
    const db = await readDb();
    const includePreview = url.searchParams.get('preview') === '1';
    jsonResponse(res, 200, {
      cvs: await groupCvsByService(db.cvs.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt)), includePreview),
    });
    return;
  }

  if (url.pathname === '/api/admin/cvs' && req.method === 'POST') {
    const auth = await requireAuth(req, res);
    if (!auth) return;
    const body = await readBody(req, maxUploadBytes + 1024 * 128);
    const parts = parseMultipart(body, req.headers['content-type']);
    const serviceId = String(parts.find((part) => part.name === 'serviceId')?.content.toString('utf8') || '').trim();
    const files = parts.filter((part) => part.name === 'files' && part.filename);
    if (!/^service-\d+$/.test(serviceId)) {
      errorResponse(res, 400, 'Servicio invalido');
      return;
    }
    if (!files.length) {
      errorResponse(res, 400, 'No se recibieron archivos');
      return;
    }

    const saved = [];
    for (const file of files) {
      const extension = extname(file.filename).toLowerCase();
      if (!allowedExtensions.has(extension) || !allowedMimeTypes.has(file.contentType)) {
        errorResponse(res, 415, 'Solo se aceptan PDF, DOC y DOCX');
        return;
      }
      if (file.content.length > maxUploadBytes) {
        errorResponse(res, 413, `Cada archivo debe pesar hasta ${Math.round(maxUploadBytes / 1024 / 1024)} MB`);
        return;
      }
      const id = randomBytes(16).toString('hex');
      const originalName = sanitizeFilename(file.filename);
      const storedName = `${Date.now()}-${id}${extension}`;
      await writeFile(join(uploadDir, storedName), file.content);
      const cv = {
        id,
        serviceId,
        originalName,
        storedName,
        mimeType: file.contentType,
        size: file.content.length,
        uploadedAt: new Date().toISOString(),
        uploadedBy: auth.user.id,
      };
      auth.db.cvs.push(cv);
      saved.push(await serializeCv(cv, true));
    }

    await writeDb(auth.db);
    jsonResponse(res, 201, { cvs: saved });
    return;
  }

  const deleteCvMatch = /^\/api\/admin\/cvs\/([^/]+)$/.exec(url.pathname);
  if (deleteCvMatch && req.method === 'DELETE') {
    const auth = await requireAuth(req, res);
    if (!auth) return;
    const cvId = decodeURIComponent(deleteCvMatch[1]);
    const cv = auth.db.cvs.find((item) => item.id === cvId);
    if (!cv) {
      errorResponse(res, 404, 'CV no encontrado');
      return;
    }
    auth.db.cvs = auth.db.cvs.filter((item) => item.id !== cvId);
    await writeDb(auth.db);
    await rm(join(uploadDir, cv.storedName), { force: true });
    jsonResponse(res, 200, { ok: true });
    return;
  }

  if (url.pathname === '/api/admin/cvs' && req.method === 'DELETE') {
    const auth = await requireAuth(req, res);
    if (!auth) return;
    const serviceId = url.searchParams.get('serviceId');
    const toDelete = serviceId ? auth.db.cvs.filter((cv) => cv.serviceId === serviceId) : auth.db.cvs;
    auth.db.cvs = serviceId ? auth.db.cvs.filter((cv) => cv.serviceId !== serviceId) : [];
    await writeDb(auth.db);
    await Promise.all(toDelete.map((cv) => rm(join(uploadDir, cv.storedName), { force: true })));
    jsonResponse(res, 200, { ok: true });
    return;
  }

  if (url.pathname === '/api/settings/location' && req.method === 'GET') {
    const db = await readDb();
    jsonResponse(res, 200, { location: db.settings.location || null });
    return;
  }

  if (url.pathname === '/api/admin/settings/location' && req.method === 'PUT') {
    const auth = await requireAuth(req, res);
    if (!auth) return;
    const { address, mapsUrl } = await parseJsonBody(req);
    if (!String(address || '').trim() || !String(mapsUrl || '').startsWith('https://www.google.com/maps/search/')) {
      errorResponse(res, 400, 'Direccion invalida');
      return;
    }
    auth.db.settings.location = {
      address: String(address).trim(),
      mapsUrl: String(mapsUrl).trim(),
      updatedAt: new Date().toISOString(),
      updatedBy: auth.user.id,
    };
    await writeDb(auth.db);
    jsonResponse(res, 200, { location: auth.db.settings.location });
    return;
  }

  if (url.pathname === '/api/admin/settings/location' && req.method === 'DELETE') {
    const auth = await requireAuth(req, res);
    if (!auth) return;
    delete auth.db.settings.location;
    await writeDb(auth.db);
    jsonResponse(res, 200, { ok: true });
    return;
  }

  errorResponse(res, 404, 'Endpoint no encontrado');
};

const sendFile = async (res, filePath, asAttachmentName = '') => {
  try {
    const fileStat = await stat(filePath);
    if (!fileStat.isFile()) {
      errorResponse(res, 404, 'No encontrado');
      return;
    }
    const extension = extname(filePath).toLowerCase();
    const headers = {
      'content-type': mimeTypes[extension] || 'application/octet-stream',
      'content-length': fileStat.size,
      'cache-control': extension === '.html' ? 'no-cache' : 'public, max-age=31536000, immutable',
    };
    if (asAttachmentName) headers['content-disposition'] = `inline; filename="${asAttachmentName.replaceAll('"', '')}"`;
    res.writeHead(200, headers);
    createReadStream(filePath).pipe(res);
  } catch {
    errorResponse(res, 404, 'No encontrado');
  }
};

const isInside = (base, target) => {
  const relative = normalize(target).slice(normalize(base).length);
  return target === base || relative.startsWith(sep);
};

const handleUploads = async (req, res, url) => {
  if (req.method !== 'GET') {
    errorResponse(res, 405, 'Metodo no permitido');
    return;
  }
  const storedName = decodeURIComponent(url.pathname.replace('/uploads/', ''));
  const db = await readDb();
  const cv = db.cvs.find((item) => item.storedName === storedName);
  if (!cv) {
    errorResponse(res, 404, 'Archivo no encontrado');
    return;
  }
  const filePath = resolve(uploadDir, storedName);
  if (!isInside(uploadDir, filePath)) {
    errorResponse(res, 400, 'Ruta invalida');
    return;
  }
  await sendFile(res, filePath, cv.originalName);
};

const handleStatic = async (req, res, url) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    errorResponse(res, 405, 'Metodo no permitido');
    return;
  }
  const pathname = decodeURIComponent(url.pathname);
  let filePath = resolve(distDir, pathname === '/' ? 'index.html' : pathname.slice(1));
  if (!isInside(distDir, filePath)) {
    errorResponse(res, 400, 'Ruta invalida');
    return;
  }
  try {
    const fileStat = await stat(filePath);
    if (fileStat.isDirectory()) filePath = join(filePath, 'index.html');
  } catch {
    filePath = resolve(distDir, 'index.html');
  }
  await sendFile(res, filePath);
};

await ensureStorage();

createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    if (url.pathname.startsWith('/api/')) {
      await handleApi(req, res, url);
      return;
    }
    if (url.pathname.startsWith('/uploads/')) {
      await handleUploads(req, res, url);
      return;
    }
    await handleStatic(req, res, url);
  } catch (error) {
    const status = error?.status || 500;
    errorResponse(res, status, status === 500 ? 'Error interno' : error.message);
    if (status === 500) console.error(error);
  }
}).listen(port, () => {
  console.log(`AVC backend escuchando en http://localhost:${port}`);
});

export { hashPassword };
