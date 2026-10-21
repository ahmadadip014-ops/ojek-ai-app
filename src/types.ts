export type Role = 'CUSTOMER' | 'DRIVER' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  phone: string;
  role: Role;
  status?: 'PENDING' | 'AKTIF' | 'NONAKTIF' | 'TERBLOKIR';
  platMotor?: string;
  jenisMotor?: string;
  ktpPhoto?: string;
  simPhoto?: string;
  stnkPhoto?: string;
  selfieKtpPhoto?: string;
  deposit?: number;
  dailyIncome?: number;
}

export type OrderServiceType = 'PASSENGER' | 'DELIVERY' | 'FOOD' | 'MARKET';

export interface Order {
  id: string;
  type: OrderServiceType;
  customerName: string;
  customerPhone: string;
  pickupAddress: string;
  destinationAddress: string;
  notes?: string;
  distanceKm: number;
  totalCost: number;
  status: 'PENDING' | 'ACCEPTED' | 'PICKED_UP' | 'DELIVERED' | 'CANCELLED';
  driverId?: string;
  driverName?: string;
  driverPhone?: string;
  driverPlat?: string;
  createdAt: string;
}

export interface TariffConfig {
  basePrice: number;
  pricePerKm: number;
  adminFee: number;
}

export interface BrandingConfig {
  appName: string;
  appTagline: string;
  layoutStyle?: string;
  primaryColor?: string;
  whatsappAdmin?: string;
}
