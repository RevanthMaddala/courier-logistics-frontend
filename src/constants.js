// Mirrors the backend enums and transition rules so the UI only offers moves the API will accept.

export const SHIPMENT_STATUSES = [
  'CREATED',
  'PICKED_UP',
  'IN_TRANSIT',
  'IN_WAREHOUSE',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'FAILED_DELIVERY',
  'RETURNED',
  'CANCELLED',
];

export const SHIPMENT_TRANSITIONS = {
  CREATED: ['PICKED_UP', 'CANCELLED'],
  PICKED_UP: ['IN_TRANSIT', 'IN_WAREHOUSE', 'CANCELLED'],
  IN_TRANSIT: ['IN_WAREHOUSE', 'OUT_FOR_DELIVERY'],
  IN_WAREHOUSE: ['IN_TRANSIT', 'OUT_FOR_DELIVERY'],
  OUT_FOR_DELIVERY: ['DELIVERED', 'FAILED_DELIVERY'],
  FAILED_DELIVERY: ['OUT_FOR_DELIVERY', 'IN_WAREHOUSE', 'RETURNED'],
  DELIVERED: [],
  RETURNED: [],
  CANCELLED: [],
};

export const TERMINAL_STATUSES = ['DELIVERED', 'RETURNED', 'CANCELLED'];

export const PAYMENT_STATUSES = ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'];

export const PAYMENT_TRANSITIONS = {
  PENDING: ['COMPLETED', 'FAILED'],
  FAILED: ['PENDING', 'COMPLETED'],
  COMPLETED: ['REFUNDED'],
  REFUNDED: [],
};

export const PAYMENT_METHODS = [
  'CASH',
  'CASH_ON_DELIVERY',
  'CREDIT_CARD',
  'DEBIT_CARD',
  'UPI',
  'NET_BANKING',
  'WALLET',
];

export const AGENT_AVAILABILITY = ['AVAILABLE', 'ON_DELIVERY', 'OFF_DUTY'];

export const PACKAGE_TYPES = ['DOCUMENT', 'ENVELOPE', 'SMALL_PARCEL', 'BOX', 'LARGE_BOX', 'PALLET'];

export const label = (value) =>
  value ? value.toLowerCase().replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase()) : '';
