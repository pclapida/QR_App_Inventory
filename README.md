# QR App Inventory — COFICAB COFDG

Sistema de inventario con código QR para gestión de equipos de TI y operativos de planta. Desarrollado para Coficab Durango.

---

## Características principales

- **Inventario Dual** — Equipos de planta y equipos internos de TI en una sola app
- **Escaneo QR** — Consulta y movimientos de equipos escaneando desde celular o lector
- **Autenticación JWT** — Roles de Administrador y Usuario
- **Dashboard TV** — Vista de pantalla completa para inventario IT u Operativo
- **Mantenimientos** — Registro y seguimiento de mantenimientos preventivos por tipo de equipo
- **Responsiva Digital** — Genera cartas de asignación con fotos y políticas listas para firmar e imprimir (funciona en móvil)
- **Órdenes de Compra** — Seguimiento de pedidos a proveedores
- **Alertas de Stock** — Notificación por categoría cuando el stock baja del mínimo
- **Importación Excel** — Carga masiva de inventario desde archivo .xlsx

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| Backend | Node.js + Express + TypeScript |
| Base de datos | PostgreSQL 16 (Prisma ORM) |
| Autenticación | JWT + bcrypt |
| Contenedores | Docker + Docker Compose |
| Servidor web | Nginx (frontend en producción) |

---

## Instalación rápida (Docker)

### 1. Clonar el repositorio
```bash
git clone https://github.com/pclapida/QR_App_Inventory.git
cd QR_App_Inventory
```

### 2. Configurar variables de entorno
```bash
# En la raíz del proyecto
cp .env.example .env
# Edita .env y pon contraseñas seguras reales

# En el backend
cp backend/.env.example backend/.env
# Edita backend/.env con los mismos valores
```

> **IMPORTANTE:** Genera un JWT_SECRET seguro con:
> ```bash
> node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
> ```

### 3. Levantar los servicios
```bash
docker-compose up -d --build
```

### 4. Esperar a que la base de datos esté lista y correr migraciones
```bash
# La primera vez, ejecutar las migraciones de Prisma
docker exec qr_inventory_backend npx prisma migrate deploy
```

### 5. Crear usuario administrador inicial
```bash
docker exec -it qr_inventory_backend node -e "
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const hash = await bcrypt.hash('TuContrasenaSegura123!', 12);
  await prisma.user.create({ data: { email: 'admin@coficab.com', username: 'admin', password: hash, name: 'Administrador IT', role: 'ADMIN' } });
  console.log('Admin creado.');
  await prisma.\$disconnect();
}
main();
"
```

### 6. Acceder a la aplicación
- **Frontend:** `http://localhost:3000` (o `http://TU_IP:3000` desde la red local)
- **API Backend:** `http://localhost:4000`

---

## Desarrollo local (sin Docker)

```bash
# Terminal 1 — Backend
cd backend
cp .env.example .env   # y edita DATABASE_URL para apuntar a tu Postgres local
npm install
npx prisma migrate dev
npm run dev

# Terminal 2 — Frontend
cd frontend
npm install
npm run dev
```

---

## Estructura del proyecto

```
QR_App_Inventory/
├── backend/
│   ├── src/
│   │   ├── middleware/    # JWT auth, roles
│   │   ├── routes/        # items, auth, users, maintenance, purchaseOrders
│   │   └── utils/         # prisma client
│   └── prisma/            # schema y migraciones
├── frontend/
│   └── src/
│       ├── components/    # QRModal, ResponsivaModal, Navbar, etc.
│       ├── pages/         # Inventory, Scanner, AddItem, Maintenance, etc.
│       ├── context/       # AuthContext
│       └── services/      # axios api client
├── docker-compose.yml
├── .env.example           # Plantilla de variables de entorno
└── README.md
```

---

## Seguridad

- Todos los endpoints de API están protegidos con JWT
- Las rutas de escritura/borrado requieren rol `ADMIN`
- Contraseñas hasheadas con bcrypt (12 rounds)
- Rate limiting en `/api/auth/login` (10 intentos / 15 min por IP)
- Headers de seguridad HTTP con Helmet
- CORS restringido a IPs de red local RFC 1918 + orígenes configurados
- Los archivos `.env` están en `.gitignore` y **no se incluyen en el repositorio**

---

## Variables de entorno requeridas

| Variable | Descripción |
|---|---|
| `JWT_SECRET` | Secreto para firmar tokens JWT (mínimo 32 chars aleatorios) |
| `POSTGRES_PASSWORD` | Contraseña de PostgreSQL |
| `DATABASE_URL` | URL completa de conexión a Postgres |
| `FRONTEND_URL` | (Opcional) URL del frontend para CORS |

---

## Licencia

Uso interno — COFICAB Durango. Todos los derechos reservados.
