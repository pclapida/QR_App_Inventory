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

export default api;
