import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';

const NAV = [
  { to: '/', label: 'Dashboard', icon: '▦', end: true },
  { to: '/shipments', label: 'Shipments', icon: '📦' },
  { to: '/customers', label: 'Customers', icon: '👤' },
  { to: '/agents', label: 'Delivery agents', icon: '🚚' },
  { to: '/warehouses', label: 'Warehouses', icon: '🏬' },
  { to: '/payments', label: 'Payments', icon: '₹' },
  { to: '/track', label: 'Track a shipment', icon: '🔍' },
];

export default function Layout() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => setOpen(false), [location.pathname]);

  return (
    <div className="shell">
      <header className="topbar">
        <button className="icon-btn menu-btn" onClick={() => setOpen((o) => !o)} aria-label="Toggle menu">
          ☰
        </button>
        <span className="brand">Courier Logistics</span>
      </header>
      <aside className={`sidebar ${open ? 'sidebar-open' : ''}`}>
        <div className="brand brand-side">📦 Courier Logistics</div>
        <nav>
          {NAV.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className="nav-link">
              <span className="nav-icon" aria-hidden="true">
                {item.icon}
              </span>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      {open && <div className="sidebar-scrim" onClick={() => setOpen(false)} />}
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
