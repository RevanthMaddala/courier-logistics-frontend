import { agentsApi, customersApi, warehousesApi } from '../api/endpoints';
import { useApi } from './useApi';

const ALL = { size: 100, sort: 'name,asc' };

/** Customers, agents and warehouses for dropdowns (first 100 of each, by name). */
export function useLookups() {
  const { data, error, loading } = useApi(
    () =>
      Promise.all([customersApi.list(ALL), agentsApi.list(ALL), warehousesApi.list(ALL)]).then(
        ([customers, agents, warehouses]) => ({
          customers: customers.content,
          agents: agents.content,
          warehouses: warehouses.content,
        }),
      ),
    [],
  );
  return {
    customers: data?.customers || [],
    agents: data?.agents || [],
    warehouses: data?.warehouses || [],
    error,
    loading,
  };
}
