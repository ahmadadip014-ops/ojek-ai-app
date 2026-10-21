import { User, Order, TariffConfig, BrandingConfig } from '../types';

const STORAGE_KEYS = {
  SESSION: 'ojek_session_user',
  USERS: 'ojek_users_list',
  ORDERS: 'ojek_orders_list',
  TARIFF: 'ojek_tariff_config',
  BRANDING: 'ojek_branding_config',
};

// Default Configurations
export const DEFAULT_TARIFF: TariffConfig = {
  basePrice: 5000,
  pricePerKm: 2500,
  adminFee: 1000,
};

export const DEFAULT_BRANDING: BrandingConfig = {
  appName: 'Ojek Serba Bisa',
  appTagline: 'Layanan Antar Cepat & Terpercaya',
  layoutStyle: 'layout-modern',
  primaryColor: '#059669',
  whatsappAdmin: '6281234567890',
};

// Listeners for multi-tab state sync
type BroadcastCallback = (type: string) => void;
const listeners: BroadcastCallback[] = [];

export const subscribeToDataChanges = (callback: BroadcastCallback) => {
  listeners.push(callback);
  return () => {
    const index = listeners.indexOf(callback);
    if (index > -1) listeners.splice(index, 1);
  };
};

const notifyChange = (type: string) => {
  listeners.forEach((cb) => cb(type));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('storage'));
  }
};

// Session Management
export const getSession = (): User | null => {
  const data = localStorage.getItem(STORAGE_KEYS.SESSION);
  return data ? JSON.parse(data) : null;
};

export const saveSession = (user: User | null) => {
  if (user) {
    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(user));
  } else {
    localStorage.removeItem(STORAGE_KEYS.SESSION);
  }
  notifyChange('session_updated');
};

// Users Management
export const getUsers = (): User[] => {
  const data = localStorage.getItem(STORAGE_KEYS.USERS);
  return data ? JSON.parse(data) : [];
};

export const saveUsers = (users: User[]) => {
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  notifyChange('users_updated');
};

// Orders Management
export const getOrders = (): Order[] => {
  const data = localStorage.getItem(STORAGE_KEYS.ORDERS);
  return data ? JSON.parse(data) : [];
};

export const saveOrders = (orders: Order[]) => {
  localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
  notifyChange('orders_updated');
};

// Tariff Config
export const getTariffConfig = (): TariffConfig => {
  const data = localStorage.getItem(STORAGE_KEYS.TARIFF);
  return data ? JSON.parse(data) : DEFAULT_TARIFF;
};

export const saveTariffConfig = (config: TariffConfig) => {
  localStorage.setItem(STORAGE_KEYS.TARIFF, JSON.stringify(config));
  notifyChange('tariff_updated');
};

// Branding Config
export const getBrandingConfig = (): BrandingConfig => {
  const data = localStorage.getItem(STORAGE_KEYS.BRANDING);
  return data ? JSON.parse(data) : DEFAULT_BRANDING;
};

export const saveBrandingConfig = (config: BrandingConfig) => {
  localStorage.setItem(STORAGE_KEYS.BRANDING, JSON.stringify(config));
  notifyChange('branding_updated');
};
