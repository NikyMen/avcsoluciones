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
const allowedImageMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
const allowedImageExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp']);

const seedTeamProfiles = [
  {
    id: 'ariel-fretes',
    name: 'C.P. Hugo Ariel Fretes',
    role: 'Contador Publico',
    specialty: 'Especialista en Tributacion y Asesoria Impositiva',
    description:
      'Contador Publico con mas de 20 anos de experiencia en contabilidad, tributacion, auditoria interna, control interno, finanzas y reestructuracion de procesos administrativos. Ha liderado proyectos de implementacion y optimizacion de sistemas contables, financieros y de gestion, fortaleciendo el control organizacional y el cumplimiento normativo. Socio Director de AVC Soluciones Empresariales, brinda asesoria integral a empresas nacionales e inversionistas extranjeros en materia contable, tributaria, financiera, societaria y de organizacion empresarial.',
    imageUrl: '/images/team/ariel.jpeg',
    createdAt: '2026-07-13T00:00:00.000Z',
    updatedAt: '2026-07-13T00:00:00.000Z',
  },
  {
    id: 'virgilio-rodas',
    name: 'Lic. Virgilio Rodas',
    role: 'Licenciado en Ciencias Contables',
    specialty: 'Asesoria contable y tributaria',
    description:
      'Profesional con mas de 8 anos de experiencia en contabilidad e impuestos, asesoria contable y tributaria y control interno. Ha acompanado a empresas de diversos sectores en la optimizacion de procesos administrativos y financieros, aportando soluciones orientadas al cumplimiento normativo y al crecimiento sostenible. Actualmente se desempena como Socio Director de AVC Soluciones Empresariales, liderando servicios de consultoria y asesoramiento integral para empresas en Paraguay.',
    imageUrl: '/images/team/virgilio.jpeg',
    createdAt: '2026-07-13T00:00:00.000Z',
    updatedAt: '2026-07-13T00:00:00.000Z',
  },
  {
    id: 'carlos-mereles',
    name: 'C.P. Carlos Rafael Mereles Alvarez',
    role: 'Contador Publico',
    specialty: 'Gestion contable, tributaria y sistemas',
    description:
      'Contador Publico con mas de 7 anos de experiencia en contabilidad, tributacion y asesoria empresarial para empresas comerciales, de servicios e instituciones financieras. Posee solidos conocimientos en gestion contable, cumplimiento tributario y asesoria impositiva. Tambien cuenta con experiencia en implementacion de sistemas informaticos de gestion y capacitacion de equipos para optimizar procesos contables, administrativos y financieros.',
    imageUrl: '/images/team/carlos.jpeg',
    createdAt: '2026-07-13T00:00:00.000Z',
    updatedAt: '2026-07-13T00:00:00.000Z',
  },
  {
    id: 'derlis-mendoza',
    name: 'C.P. Derlis Gustavo Mendoza Colman',
    role: 'Contador Publico',
    specialty: 'Contabilidad, auditoria y gestion financiera',
    description:
      'Profesional con mas de 7 anos de experiencia en contabilidad, auditoria, tributacion y gestion financiera en empresas de distintos sectores economicos. Ha participado en planificacion financiera, analisis de estados financieros, implementacion de controles internos y cumplimiento tributario. En AVC Soluciones Empresariales acompana proyectos de consultoria y asesoria contable, tributaria, financiera y de auditoria.',
    imageUrl: '/images/team/derlis.jpeg',
    createdAt: '2026-07-13T00:00:00.000Z',
    updatedAt: '2026-07-13T00:00:00.000Z',
  },
];

const defaultServiceProfiles = {
  'service-0': ['ariel-fretes', 'virgilio-rodas', 'carlos-mereles', 'derlis-mendoza'],
  'service-1': ['ariel-fretes', 'carlos-mereles', 'derlis-mendoza'],
  'service-2': [],
  'service-3': ['ariel-fretes'],
  'service-4': [],
  'service-5': ['carlos-mereles'],
  'service-6': ['ariel-fretes', 'carlos-mereles'],
};

if (!sessionSecret || sessionSecret.length < 32) {
  console.error('Falta SESSION_SECRET o es demasiado corto. Usa al menos 32 caracteres.');
  process.exit(1);
}

const defaultDb = {
  users: [],
  sessions: [],
  cvs: [],
  teamProfiles: seedTeamProfiles,
  serviceProfiles: defaultServiceProfiles,
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
  const db = { ...defaultDb, ...JSON.parse(raw) };
  if (!Array.isArray(db.teamProfiles) || db.teamProfiles.length === 0) db.teamProfiles = seedTeamProfiles;
  if (!db.serviceProfiles || typeof db.serviceProfiles !== 'object') db.serviceProfiles = defaultServiceProfiles;
  return db;
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

const sanitizeText = (value, max = 4000) => String(value || '').trim().slice(0, max);

const serializeTeamProfile = (profile) => ({
  id: profile.id,
  name: profile.name,
  role: profile.role || '',
  specialty: profile.specialty || '',
  description: profile.description || '',
  imageUrl: profile.imageUrl || '',
  size: profile.size || 0,
  uploadedAt: profile.uploadedAt || profile.updatedAt || profile.createdAt || '',
  updatedAt: profile.updatedAt || '',
});

const serializeTeamData = (db) => ({
  profiles: db.teamProfiles.map(serializeTeamProfile),
  assignments: db.serviceProfiles || {},
});

const readMultipartText = (parts, name, fallback = '') =>
  sanitizeText(parts.find((part) => part.name === name)?.content.toString('utf8') ?? fallback);

const saveProfileImage = async (file) => {
  if (!file?.filename) return null;
  const extension = extname(file.filename).toLowerCase();
  if (!allowedImageExtensions.has(extension) || !allowedImageMimeTypes.has(file.contentType)) {
    throw Object.assign(new Error('Solo se aceptan imagenes JPG, PNG o WEBP'), { status: 415 });
  }
  if (file.content.length > maxUploadBytes) {
    throw Object.assign(new Error(`Cada imagen debe pesar hasta ${Math.round(maxUploadBytes / 1024 / 1024)} MB`), { status: 413 });
  }
  const id = randomBytes(16).toString('hex');
  const storedName = `${Date.now()}-${id}${extension}`;
  await writeFile(join(uploadDir, storedName), file.content);
  return {
    storedName,
    imageUrl: `/uploads/${encodeURIComponent(storedName)}`,
    mimeType: file.contentType,
    size: file.content.length,
    uploadedAt: new Date().toISOString(),
  };
};

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

  if (url.pathname === '/api/team-profiles' && req.method === 'GET') {
    const db = await readDb();
    jsonResponse(res, 200, serializeTeamData(db));
    return;
  }

  if (url.pathname === '/api/admin/service-profiles' && req.method === 'PUT') {
    const auth = await requireAuth(req, res);
    if (!auth) return;
    const { serviceId, profileIds } = await parseJsonBody(req);
    const cleanServiceId = String(serviceId || '').trim();
    if (!/^service-\d+$/.test(cleanServiceId)) {
      errorResponse(res, 400, 'Servicio invalido');
      return;
    }
    const allowedIds = new Set(auth.db.teamProfiles.map((profile) => profile.id));
    const nextIds = [...new Set(Array.isArray(profileIds) ? profileIds.map((id) => String(id)) : [])].filter((id) => allowedIds.has(id));
    auth.db.serviceProfiles = { ...(auth.db.serviceProfiles || {}), [cleanServiceId]: nextIds };
    await writeDb(auth.db);
    jsonResponse(res, 200, serializeTeamData(auth.db));
    return;
  }

  if (url.pathname === '/api/admin/team-profiles' && req.method === 'POST') {
    const auth = await requireAuth(req, res);
    if (!auth) return;
    const body = await readBody(req, maxUploadBytes + 1024 * 128);
    const parts = parseMultipart(body, req.headers['content-type']);
    const name = readMultipartText(parts, 'name');
    if (!name) {
      errorResponse(res, 400, 'El nombre es obligatorio');
      return;
    }
    const image = parts.find((part) => part.name === 'image' && part.filename);
    const savedImage = image ? await saveProfileImage(image) : null;
    const now = new Date().toISOString();
    const profile = {
      id: randomBytes(12).toString('hex'),
      name,
      role: readMultipartText(parts, 'role'),
      specialty: readMultipartText(parts, 'specialty'),
      description: readMultipartText(parts, 'description'),
      imageUrl: savedImage?.imageUrl || '',
      storedName: savedImage?.storedName,
      mimeType: savedImage?.mimeType,
      size: savedImage?.size || 0,
      uploadedAt: savedImage?.uploadedAt || '',
      createdAt: now,
      updatedAt: now,
      updatedBy: auth.user.id,
    };
    auth.db.teamProfiles.push(profile);
    await writeDb(auth.db);
    jsonResponse(res, 201, { profile: serializeTeamProfile(profile), ...serializeTeamData(auth.db) });
    return;
  }

  const profileMatch = /^\/api\/admin\/team-profiles\/([^/]+)$/.exec(url.pathname);
  if (profileMatch && req.method === 'PUT') {
    const auth = await requireAuth(req, res);
    if (!auth) return;
    const profileId = decodeURIComponent(profileMatch[1]);
    const profile = auth.db.teamProfiles.find((item) => item.id === profileId);
    if (!profile) {
      errorResponse(res, 404, 'Perfil no encontrado');
      return;
    }
    const body = await readBody(req, maxUploadBytes + 1024 * 128);
    const parts = parseMultipart(body, req.headers['content-type']);
    const name = readMultipartText(parts, 'name', profile.name);
    if (!name) {
      errorResponse(res, 400, 'El nombre es obligatorio');
      return;
    }
    const image = parts.find((part) => part.name === 'image' && part.filename);
    const previousStoredName = profile.storedName;
    const savedImage = image ? await saveProfileImage(image) : null;
    Object.assign(profile, {
      name,
      role: readMultipartText(parts, 'role', profile.role),
      specialty: readMultipartText(parts, 'specialty', profile.specialty),
      description: readMultipartText(parts, 'description', profile.description),
      updatedAt: new Date().toISOString(),
      updatedBy: auth.user.id,
      ...(savedImage || {}),
    });
    if (savedImage && previousStoredName) await rm(join(uploadDir, previousStoredName), { force: true });
    await writeDb(auth.db);
    jsonResponse(res, 200, { profile: serializeTeamProfile(profile), ...serializeTeamData(auth.db) });
    return;
  }

  if (profileMatch && req.method === 'DELETE') {
    const auth = await requireAuth(req, res);
    if (!auth) return;
    const profileId = decodeURIComponent(profileMatch[1]);
    const profile = auth.db.teamProfiles.find((item) => item.id === profileId);
    if (!profile) {
      errorResponse(res, 404, 'Perfil no encontrado');
      return;
    }
    auth.db.teamProfiles = auth.db.teamProfiles.filter((item) => item.id !== profileId);
    for (const [serviceId, ids] of Object.entries(auth.db.serviceProfiles || {})) {
      auth.db.serviceProfiles[serviceId] = (Array.isArray(ids) ? ids : []).filter((id) => id !== profileId);
    }
    await writeDb(auth.db);
    if (profile.storedName) await rm(join(uploadDir, profile.storedName), { force: true });
    jsonResponse(res, 200, serializeTeamData(auth.db));
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
  const profile = db.teamProfiles.find((item) => item.storedName === storedName);
  if (!cv && !profile) {
    errorResponse(res, 404, 'Archivo no encontrado');
    return;
  }
  const filePath = resolve(uploadDir, storedName);
  if (!isInside(uploadDir, filePath)) {
    errorResponse(res, 400, 'Ruta invalida');
    return;
  }
  await sendFile(res, filePath, cv?.originalName || profile?.name || storedName);
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
