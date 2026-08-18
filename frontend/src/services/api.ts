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
  originPlant?: string;
  isITInternal?: boolean;
  assignedTo?: string;
  assignedDate?: string;
  assignedArea?: string;
  assignedBadge?: string;
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
      const isConcurrent = error.response.data?.code === 'CONCURRENT_SESSION_TERMINATED';
      localStorage.removeItem('qr_inventory_token');
      localStorage.removeItem('qr_inventory_user');
      if (window.location.pathname !== '/login') {
        window.location.href = isConcurrent ? '/login?concurrent=1' : '/login?expired=1';
      }
    }
    return Promise.reject(error);
  }
);

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

export const itemsApi = {
  getAll: async (params?: any) => {
    const res = await api.get('/items', { params });
    return res.data;
  },
  getById: async (id: string) => {
    const res = await api.get(`/items/${id}`);
    return res.data as Item;
  },
  assign: async (id: string, data: any) => {
    const res = await api.post(`/items/${id}/assign`, data);
    return res.data as { message: string; item: Item };
  },
  unassign: async (id: string, data?: { notes?: string }) => {
    const res = await api.post(`/items/${id}/unassign`, data || {});
    return res.data as { message: string; item: Item };
  },
  decommission: async (id: string, data: { reason: string; notes?: string; responsiblePerson?: string; disposalMethod?: string }) => {
    const res = await api.post(`/items/${id}/decommission`, data);
    return res.data as { message: string; item: Item };
  },
  reactivate: async (id: string, data?: { newStock?: number; notes?: string }) => {
    const res = await api.post(`/items/${id}/reactivate`, data || {});
    return res.data as { message: string; item: Item };
  },
  transfer: async (id: string, data: { targetPlant: string; notes?: string }) => {
    const res = await api.post(`/items/${id}/transfer`, data);
    return res.data as { message: string; item: Item };
  },
  deletePermanent: async (id: string) => {
    const res = await api.delete(`/items/${id}`);
    return res.data as { message: string };
  }
};

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
  signatureData?: string | null;
  email?: string;
  emailSent?: boolean;
  createdAt: string;
}

export interface DeviceLoan {
  id: string;
  itemId: string;
  item?: Item;
  borrowerName: string;
  borrowerArea?: string | null;
  borrowerBadge?: string | null;
  loanDate: string;
  expectedReturn: string;
  actualReturn?: string | null;
  status: 'ACTIVE' | 'RETURNED' | 'OVERDUE';
  loanNotes?: string | null;
  returnNotes?: string | null;
  loanedBy: string;
  receivedBy?: string | null;
  isOverdue?: boolean;
  createdAt: string;
  updatedAt: string;
}

export const responsivasApi = {
  getAll: async () => {
    const res = await api.get('/responsivas');
    return res.data as ResponsivaHistory[];
  },
  create: async (data: Partial<ResponsivaHistory> & { accesoriosJson?: string; photoUrlsJson?: string; signatureData?: string | null }) => {
    const res = await api.post('/responsivas', data);
    return res.data as ResponsivaHistory;
  },
  sendEmail: async (payload: { responsivaId: string | null; htmlContent: string; toEmail: string; colaborador: string; nombreEquipo: string }) => {
    const res = await api.post('/responsivas/send-email', payload);
    return res.data as { success: boolean; message: string };
  }
};

export const loansApi = {
  getAll: async (params?: { status?: string; itemId?: string }) => {
    const res = await api.get('/loans', { params });
    return res.data as DeviceLoan[];
  },
  create: async (data: {
    itemId: string;
    borrowerName: string;
    borrowerArea?: string;
    borrowerBadge?: string;
    expectedReturn: string;
    loanNotes?: string;
  }) => {
    const res = await api.post('/loans', data);
    return res.data as DeviceLoan;
  },
  returnLoan: async (id: string, returnNotes?: string) => {
    const res = await api.put(`/loans/${id}/return`, { returnNotes });
    return res.data as DeviceLoan;
  },
  delete: async (id: string) => {
    const res = await api.delete(`/loans/${id}`);
    return res.data as { message: string };
  }
};

export const adminApi = {
  getStats: async () => {
    const res = await api.get('/users/stats/summary');
    return res.data.stats as {
      users: number;
      items: number;
      transactions: number;
      maintenances: number;
      purchaseOrders: number;
      responsivas: number;
      deviceLoans: number;
      totalRecords: number;
    };
  },
  downloadBackup: async () => {
    const res = await api.get('/users/backup/download', { responseType: 'blob' });
    return res.data as Blob;
  }
};

export default api;
