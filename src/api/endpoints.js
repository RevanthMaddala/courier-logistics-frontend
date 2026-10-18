import { http } from './client';

function crud(base) {
  return {
    list: (params) => http.get(base, params),
    get: (id) => http.get(`${base}/${id}`),
    create: (body) => http.post(base, body),
    update: (id, body) => http.put(`${base}/${id}`, body),
    remove: (id) => http.del(`${base}/${id}`),
  };
}

export const customersApi = crud('/customers');

export const warehousesApi = crud('/warehouses');

export const agentsApi = {
  ...crud('/delivery-agents'),
  setAvailability: (id, availability) =>
    http.patch(`/delivery-agents/${id}/availability`, undefined, { availability }),
};

export const shipmentsApi = {
  ...crud('/shipments'),
  updateStatus: (id, body) => http.patch(`/shipments/${id}/status`, body),
  assignAgent: (id, agentId) => http.put(`/shipments/${id}/delivery-agent/${agentId}`),
  assignWarehouse: (id, warehouseId) => http.put(`/shipments/${id}/warehouse/${warehouseId}`),
  history: (id) => http.get(`/shipments/${id}/tracking-history`),
  addCheckpoint: (id, body) => http.post(`/shipments/${id}/tracking-history`, body),
};

export const packagesApi = {
  list: (shipmentId) => http.get(`/shipments/${shipmentId}/packages`),
  create: (shipmentId, body) => http.post(`/shipments/${shipmentId}/packages`, body),
  update: (shipmentId, packageId, body) => http.put(`/shipments/${shipmentId}/packages/${packageId}`, body),
  remove: (shipmentId, packageId) => http.del(`/shipments/${shipmentId}/packages/${packageId}`),
};

export const paymentsApi = {
  list: (params) => http.get('/payments', params),
  get: (id) => http.get(`/payments/${id}`),
  forShipment: (shipmentId) => http.get(`/shipments/${shipmentId}/payment`),
  create: (shipmentId, body) => http.post(`/shipments/${shipmentId}/payment`, body),
  updateStatus: (id, paymentStatus) => http.patch(`/payments/${id}/status`, { paymentStatus }),
};

export const trackingApi = {
  track: (trackingNumber) => http.get(`/track/${encodeURIComponent(trackingNumber)}`),
};
