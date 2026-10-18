import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import DashboardPage from './pages/DashboardPage';
import ShipmentsPage from './pages/ShipmentsPage';
import ShipmentCreatePage from './pages/ShipmentCreatePage';
import ShipmentDetailPage from './pages/ShipmentDetailPage';
import CustomersPage from './pages/CustomersPage';
import AgentsPage from './pages/AgentsPage';
import WarehousesPage from './pages/WarehousesPage';
import PaymentsPage from './pages/PaymentsPage';
import TrackPage from './pages/TrackPage';
import { EmptyState } from './components/ui';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<DashboardPage />} />
        <Route path="shipments" element={<ShipmentsPage />} />
        <Route path="shipments/new" element={<ShipmentCreatePage />} />
        <Route path="shipments/:id" element={<ShipmentDetailPage />} />
        <Route path="customers" element={<CustomersPage />} />
        <Route path="agents" element={<AgentsPage />} />
        <Route path="warehouses" element={<WarehousesPage />} />
        <Route path="payments" element={<PaymentsPage />} />
        <Route path="track" element={<TrackPage />} />
        <Route path="track/:trackingNumber" element={<TrackPage />} />
        <Route path="*" element={<EmptyState>Page not found.</EmptyState>} />
      </Route>
    </Routes>
  );
}
