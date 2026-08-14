import axios from 'axios';

export interface User {
  id: string;
  email: string;
  username: string;
  name: string;
  role: string;
}

export interface Item {
  id: string;
  sku: string;
  name: string;
  model?: string;
  serialNumber?: string;
  description?: string;
  notes?: string;
  faults?: string;
  category?: string;
  area?: string;
  ipAddress?: string;
  hasWarranty?: boolean;
  warrantyExpiration?: string;
  plant?: string;
  isITInternal?: boolean;
  assignedTo?: string;
  status?: 'ACTIVE' | 'DECOMMISSIONED';
  decommissionDate?: string;
  decommissionReason?: string;
  decommissionNotes?: string;
  decommissionedBy?: string;
  disposalMethod?: string;
  decommissionActNumber?: string;
  bitlockerKey?: string;
  devicePassword?: string;
  customAttributes?: string | Record<string, string>;
  stock: number;
  minStock: number;
  unit: string;
  location?: string;
  qrCodePayload: string;
  createdAt: string;
  updatedAt: string;
  transactions?: Transaction[];
  maintenances?: any[];
  responsivas?: ResponsivaHistory[];
}

export interface TimelineEvent {
  id: string;
  type: 'CREATION' | 'INBOUND' | 'OUTBOUND' | 'TRANSFER' | 'EDIT' | 'MAINTENANCE' | 'RESPONSIVA' | 'DECOMMISSION' | 'REACTIVATE';
  title: string;
  description: string;
  date: string;
  performedBy: string;
  meta?: Record<string, any>;
}

export interface Transaction {
  id: string;
  itemId: string;
  userId: string;
  type: 'INBOUND' | 'OUTBOUND' | 'TRANSFER' | 'EDIT' | 'CREATION' | string;
  quantity: number;
  assignedTo?: string;
  fromPlant?: string;
  toPlant?: string;
  notes?: string;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    username: string;
  };
}

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('qr_inventory_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('qr_inventory_token');
      localStorage.removeItem('qr_inventory_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login?expired=1';
      }
    }
    return Promise.reject(error);
  }
);

export interface ResponsivaHistory {
  id: string;
  itemId: string;
  item?: Item;
  colaborador: string;
  marcaModelo: string;
  serie: string;
  nombreEquipo: string;
  accesoriosJson: string;
  observaciones?: string;
  photoUrlsJson?: string;
  email?: string;
  emailSent?: boolean;
  createdAt: string;
}

export interface Requisition {
  id: string;
  reqNumber?: string;
  requisitionFor?: string;
  poNumber?: string;
  supplier: string;
  itemName: string;
  category?: string;
  quantity: number;
  unitPrice?: number;
  totalPrice?: number;
  status: 'PENDING' | 'APPROVED' | 'ORDERED' | 'RECEIVED' | 'CANCELLED';
  receivedDate?: string;
  receivedBy?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export type PurchaseOrder = Requisition;

export const responsivasApi = {
  getAll: async () => {
    const res = await api.get('/responsivas');
    return res.data as ResponsivaHistory[];
  },
  create: async (data: Partial<ResponsivaHistory> & { accesoriosJson?: string; photoUrlsJson?: string }) => {
    const res = await api.post('/responsivas', data);
    return res.data as ResponsivaHistory;
  },
  sendEmail: async (payload: { responsivaId: string | null; htmlContent: string; toEmail: string; colaborador: string; nombreEquipo: string }) => {
    const res = await api.post('/responsivas/send-email', payload);
    return res.data as { success: boolean; message: string };
  }
};

export default api;
