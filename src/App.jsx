// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Clientes from './pages/Clientes';
import Empresas from './pages/Empresas';
import Reservaciones from './pages/Reservaciones';
import Bloqueos from './pages/Bloqueos';
import Reportes from './pages/Reportes';
import Usuarios from './pages/configuracion/Usuarios';
import Destinos from './pages/configuracion/Destinos';
import Autobuses from './pages/configuracion/Autobuses';
import Aerolineas from './pages/configuracion/Aerolineas';
import Bitacora from './pages/configuracion/Bitacora';
import LimiteCliente from './pages/configuracion/reservaciones/LimiteCliente';
import Proveedores from './pages/directorios/Proveedores';
import VentasAgencia from './pages/reportes/VentasAgencia';
import PagosProveedores from './pages/reportes/PagosProveedores';
import AbonosReserva from './pages/reservaciones/AbonosReserva';
import PasajerosTransito from './pages/reportes/PasajerosTransito';
import ReporteServicio from './pages/reportes/ReporteServicio';
import ReporteDifusion from './pages/reportes/ReporteDifusion';
import CalendarioReservas from './pages/operacion/CalendarioReservas';
import KanbanProspectos from './pages/clientes/KanbanProspectos';
import Cotizador from './pages/reservaciones/Cotizador';
import Hoteles from './pages/configuracion/Hoteles';
import Paquetes from './pages/configuracion/Paquetes';
import GeneradorVoucher from './pages/operacion/GeneradorVoucher';
import ListaVouchers from './pages/operacion/ListaVouchers';
import CajaChica from './pages/finanzas/CajaChica';

function App() {
  return (
    <Router>
      <div className="flex min-h-screen bg-gray-100">
        <Sidebar />
        <main className="flex-1 ml-64 p-8 min-w-0 overflow-x-hidden">
          <Routes>
            <Route path="/" element={<Dashboard />} />

            {/* Rutas de Directorios */}
            <Route path="/directorios/clientes" element={<Clientes />} />
            <Route path="/directorios/empresas" element={<Empresas />} />
            <Route path="/directorios/proveedores" element={<Proveedores />} />

            {/* Rutas de Reservaciones */}
            <Route path="/reservaciones" element={<Reservaciones />} />

            {/* Rutas de Configuración */}
            <Route path="/configuracion/usuarios" element={<Usuarios />} />
            <Route path="/configuracion/destinos" element={<Destinos />} />
            <Route path="/configuracion/hoteles" element={<Hoteles />} />
            <Route path="/configuracion/paquetes" element={<Paquetes />} />
            <Route path="/configuracion/autobuses" element={<Autobuses />} />
            <Route path="/configuracion/aerolineas" element={<Aerolineas />} />
            <Route path="/configuracion/bitacora" element={<Bitacora />} />

            {/* Rutas de Inventario y Reportes */}
            <Route path="/bloqueos" element={<Bloqueos />} />
            <Route path="/reportes/ventas" element={<Reportes />} />
            {/* Rutas de Reservaciones adicionales */}
            <Route path="/reservaciones/abonos" element={<AbonosReserva />} />
            <Route path="/reservaciones/limite-cliente" element={<LimiteCliente />} />
            <Route path="/reservaciones/nueva" element={<Cotizador />} />

            {/* Rutas de Reportes adicionales */}
            <Route path="/reportes/ventas-agencia" element={<VentasAgencia />} />
            <Route path="/reportes/pagos-proveedores" element={<PagosProveedores />} />
            <Route path="/reportes/pasajeros-transito" element={<PasajerosTransito />} />
            <Route path="/reportes/servicio" element={<ReporteServicio />} />
            <Route path="/reportes/difusion" element={<ReporteDifusion />} />

            {/* Rutas de Operación */}
            <Route path="/operacion/calendario" element={<CalendarioReservas />} />
            <Route path="/operacion/vouchers" element={<ListaVouchers />} />
            <Route path="/operacion/voucher/:id" element={<GeneradorVoucher />} />


            {/* Rutas de Clientes */}
            <Route path="/clientes/kanban" element={<KanbanProspectos />} />

            {/* Rutas de Finanzas */}
            <Route path="/finanzas/caja-chica" element={<CajaChica />} />

          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;