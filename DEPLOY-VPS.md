# Deploy en VPS

Guia para publicar AVC Soluciones en un VPS Linux con Node.js, pnpm, PM2 y Nginx.

## 1. Requisitos del servidor

- Ubuntu 22.04/24.04 o Debian equivalente.
- Dominio apuntando al VPS: `avcsoluciones.com.py` y opcionalmente `www.avcsoluciones.com.py`.
- Node.js 22 LTS o superior.
- pnpm, PM2, Nginx y Certbot.

```bash
sudo apt update
sudo apt install -y nginx git curl
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pnpm pm2
```

## 2. Subir el proyecto

Ruta esperada por PM2:

```bash
sudo mkdir -p /var/www/avcsoluciones
sudo chown -R $USER:$USER /var/www/avcsoluciones
cd /var/www/avcsoluciones
git clone TU_REPO_AQUI .
```

Si subis por SFTP/rsync, copia todo el proyecto excepto `node_modules`, `.astro` y logs temporales.

## 3. Variables de entorno

```bash
cp .env.example .env
nano .env
```

Valores recomendados:

```bash
NODE_ENV=production
PORT=3550
STATIC_DIR=./dist
SESSION_SECRET=CAMBIAR_POR_UN_SECRETO_LARGO_DE_32_CARACTERES_O_MAS
DATA_DIR=./data
UPLOAD_DIR=./data/uploads
DB_PATH=./data/db.json
MAX_UPLOAD_MB=10
```

Generar un secreto:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

## 4. Instalar, compilar y crear admin

```bash
pnpm install --frozen-lockfile
pnpm build
mkdir -p data/uploads logs
pnpm admin:create -- --username=admin --name=admin --password='CAMBIAR_ESTA_PASSWORD'
```

La contrasena debe tener minimo 8 caracteres.

## 5. Levantar con PM2

```bash
pnpm pm2:start
pm2 save
pm2 startup
```

El comando `pm2 startup` imprime otro comando con `sudo`; copialo y ejecutalo para que la app arranque al reiniciar el VPS.

Comandos utiles:

```bash
pm2 status
pm2 logs avcsoluciones
pnpm pm2:reload
```

## 6. Configurar Nginx

```bash
sudo cp deploy/nginx-avcsoluciones.conf /etc/nginx/sites-available/avcsoluciones
sudo ln -s /etc/nginx/sites-available/avcsoluciones /etc/nginx/sites-enabled/avcsoluciones
sudo nginx -t
sudo systemctl reload nginx
```

Probar antes de SSL:

```bash
curl http://127.0.0.1:3550/api/health
curl http://avcsoluciones.com.py/api/health
```

## 7. Activar HTTPS

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d avcsoluciones.com.py -d www.avcsoluciones.com.py
```

## 8. Actualizar una version

```bash
cd /var/www/avcsoluciones
git pull
pnpm install --frozen-lockfile
pnpm build
pnpm pm2:reload
```

## 9. Datos persistentes

No borres estas carpetas en deploy:

- `data/db.json`: usuarios, sesiones, equipo, settings y estadisticas de trafico.
- `data/uploads/`: imagenes subidas desde el panel.
- `logs/`: logs PM2.

Para backup:

```bash
tar -czf avcsoluciones-backup-$(date +%F).tar.gz data .env
```

## 10. Dashboard de trafico por pais

El dashboard intenta detectar pais por cabeceras de proxy/CDN:

- `CF-IPCountry` si usas Cloudflare.
- `X-Vercel-IP-Country`.
- `CloudFront-Viewer-Country`.
- `X-Country-Code`.

Si el VPS recibe trafico directo sin CDN que agregue pais, el sistema usa `Accept-Language` como aproximacion. Para mayor precision en produccion, conviene poner el dominio detras de Cloudflare con proxy activado.
