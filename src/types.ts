```ts
export type Role = 'CUSTOMER' | 'DRIVER' | 'ADMIN';

export type UserStatus =
  | 'PENDING'
  | 'AKTIF'
  | 'NONAKTIF'
  | 'TERBLOKIR';

export type OrderServiceType =
  | 'PASSENGER'
  | 'DELIVERY'
  | 'FOOD'
  | 'MARKET';

export type OrderStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'PICKED_UP'
  | 'DELIVERED'
  | 'CANCELLED';

export type PaymentMethod = 'CASH';

export type PaymentStatus =
  | 'UNPAID'
  | 'PAID';

export interface User {
  id: string;
  name: string;
  phone: string;
  role: Role;
  status?: UserStatus;

  platMotor?: string;
  jenisMotor?: string;

  ktpPhoto?: string;
  simPhoto?: string;
  stnkPhoto?: string;
  selfieKtpPhoto?: string;

  deposit?: number;
  dailyIncome?: number;

  address?: string;
  registeredAt?: string;
  verifiedAt?: string;
}

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

  status: OrderStatus;

  driverId?: string;
  driverName?: string;
  driverPhone?: string;
  driverPlat?: string;

  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;

  driverCommission?: number;
  platformCommission?: number;

  createdAt: string;
  updatedAt?: string;
  completedAt?: string;
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

export const DEFAULT_TARIFF: TariffConfig = {
  basePrice: 6000,
  pricePerKm: 2500,
  adminFee: 3000,
};

export const COMMISSION = {
  DRIVER_PERCENT: 90,
  PLATFORM_PERCENT: 10,
} as const;

export function calculateFare(
  distanceKm: number,
  service: OrderServiceType,
  tariff: TariffConfig = DEFAULT_TARIFF
): number {
  if (!Number.isFinite(distanceKm) || distanceKm < 0) {
    throw new Error('Jarak perjalanan tidak valid.');
  }

  const extraKm = Math.max(0, Math.ceil(distanceKm - 3));
  const base = Math.max(0, tariff.basePrice);
  const perKm = Math.max(0, tariff.pricePerKm);
  const shoppingFee =
    service === 'MARKET' ? Math.max(0, tariff.adminFee) : 0;

  return Math.round(base + extraKm * perKm + shoppingFee);
}

export function calculateCommission(totalCost: number) {
  if (!Number.isFinite(totalCost) || totalCost < 0) {
    throw new Error('Total tarif tidak valid.');
  }

  const driverCommission = Math.floor(
    (totalCost * COMMISSION.DRIVER_PERCENT) / 100
  );

  const platformCommission = totalCost - driverCommission;

  return {
    driverCommission,
    platformCommission,
  };
}
```
