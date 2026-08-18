import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import itemRoutes from './routes/items';
import transactionRoutes from './routes/transactions';
import maintenanceRoutes from './routes/maintenance';
import purchaseOrderRoutes from './routes/purchaseOrders';
import responsivaRoutes from './routes/responsiva';
import loanRoutes from './routes/loans';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Security headers
app.use(helmet({ contentSecurityPolicy: false }));

// CORS — allow localhost, local network IPs (10.x, 192.168.x, 172.16-31.x), and FRONTEND_URL
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:80',
  'http://localhost',
  'http://127.0.0.1:3000',
  process.env.FRONTEND_URL
].filter(Boolean) as string[];

// Regex to match private/LAN IP ranges (RFC 1918)
const isLocalNetworkOrigin = (origin: string): boolean => {
  try {
    const { hostname } = new URL(origin);
    return (
      /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname) ||          // 10.0.0.0/8
      /^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname) ||              // 192.168.0.0/16
      /^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/.test(hostname) // 172.16.0.0/12
    );
  } catch {
    return false;
  }
};

app.use(cors({
  origin: (origin, callback) => {
    // Allow: no origin (Postman, same-origin), explicit list, or local LAN IPs
    if (!origin || allowedOrigins.includes(origin) || isLocalNetworkOrigin(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: Origen no permitido: ${origin}`));
    }
  },
  credentials: true
}));

// Body size limit — increased to handle HTML with embedded base64 photos for email sending
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// Root welcome & status endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'QR Inventory REST API Backend',
    status: 'running',
    version: '1.0.0',
    message: 'Esta es la API REST del backend en el puerto 4000. Para ingresar a la interfaz web del sistema, abre http://localhost:3000 en tu navegador.',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth/login',
      users: '/api/users',
      items: '/api/items',
      maintenance: '/api/maintenance',
      purchaseOrders: '/api/purchase-orders'
    }
  });
});

// Healthcheck
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'QR Inventory API' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/items', transactionRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/purchase-orders', purchaseOrderRoutes);
app.use('/api/responsivas', responsivaRoutes);
app.use('/api/loans', loanRoutes);

// Error Handling Middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled API error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Error interno en el servidor API'
  });
});

app.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(`🚀 SERVIDOR REST API INICIADO EN PUERTO ${PORT}`);
  console.log(`=================================================`);
});
