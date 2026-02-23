// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import { ShieldX } from 'lucide-react';
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
import { SpeedInsights } from '@vercel/speed-insights/react';

// Componente interno que tiene acceso al contexto
function AppContent() {
  const { user, loading, accesoDenegado, limpiarError } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/50 text-xs uppercase tracking-widest font-bold">Verificando acceso...</p>
        </div>
      </div>
    );
  }

  // Correo no autorizado
  if (accesoDenegado) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-red-950 to-slate-900">
        <div className="text-center max-w-sm px-6">
          <div className="w-20 h-20 rounded-3xl bg-red-500/20 border border-red-500/30 flex items-center justify-center mx-auto mb-6">
            <ShieldX className="text-red-400" size={36} />
          </div>
          <h2 className="text-2xl font-black text-white mb-2 tracking-tight">Acceso Denegado</h2>
          <p className="text-slate-400 text-sm mb-2">
            El correo <span className="text-red-400 font-bold">{accesoDenegado.correo}</span> no está
            registrado como usuario del CRM.
          </p>
          <p className="text-slate-500 text-xs mb-8">
            Contacta al administrador del sistema para solicitar acceso.
          </p>
          <button
            onClick={limpiarError}
            className="bg-white/10 hover:bg-white/20 text-white font-bold px-6 py-3 rounded-2xl transition-all border border-white/10 text-sm"
          >
            Intentar con otro correo
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  // Con sesión → mostrar CRM completo
  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 p-8 min-w-0 overflow-x-hidden">
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
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
        <SpeedInsights />
      </AuthProvider>
    </Router>
  );
}

export default App;