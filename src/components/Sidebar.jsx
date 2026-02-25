import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useLocation } from 'react-router-dom';
import {
    Calendar, CalendarDays, Users, FileText, Settings,
    Lock, ChevronDown, Ticket,
    Wallet, LayoutDashboard, LogOut, X, Menu
} from 'lucide-react';

// ── Ítem con submenú colapsable ──────────────────────────────────────
const SidebarItem = ({ icon: Icon, label, to, subItems = [], onNavClick }) => {
    const location = useLocation();
    const hasChildren = subItems.length > 0;
    const isChildActive = subItems.some(item => location.pathname === item.to);
    const [open, setOpen] = useState(isChildActive);
    const isActive = !hasChildren && location.pathname === to;

    return (
        <div className="mb-0.5">
            <Link
                to={hasChildren ? '#' : to}
                onClick={e => {
                    if (hasChildren) { e.preventDefault(); setOpen(p => !p); }
                    else if (onNavClick) onNavClick();
                }}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-150 group ${isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-100'
                    : 'text-slate-600 hover:bg-blue-50 hover:text-blue-600'
                    }`}
            >
                <div className="flex items-center gap-3">
                    <Icon size={17} className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-500'} />
                    <span className="text-[11px] font-bold">{label}</span>
                </div>
                {hasChildren && (
                    <ChevronDown
                        size={13}
                        className={`text-slate-400 transition-transform duration-200 ${open ? 'rotate-0' : '-rotate-90'}`}
                    />
                )}
            </Link>

            {hasChildren && (
                <div className={`overflow-hidden transition-all duration-250 ${open ? 'max-h-96 opacity-100 mt-0.5' : 'max-h-0 opacity-0'}`}>
                    <div className="ml-5 pl-3 border-l-2 border-slate-100 space-y-0.5 py-1">
                        {subItems.map((item, i) => {
                            const active = location.pathname === item.to;
                            return (
                                <Link
                                    key={i}
                                    to={item.to}
                                    onClick={onNavClick}
                                    className={`block px-2 py-1.5 rounded-lg text-[11px] font-medium transition-all ${active
                                        ? 'bg-blue-50 text-blue-700 font-bold'
                                        : 'text-slate-500 hover:text-blue-600 hover:bg-blue-50/50'
                                        }`}
                                >
                                    {item.label}
                                </Link>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

// ── Separador de sección ──────────────────────────────────────────────
const SectionLabel = ({ label }) => (
    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-3 pt-4 pb-1">
        {label}
    </p>
);

// ── Footer con datos del usuario autenticado ──────────────────────────
function FooterUsuario() {
    const { user, logout } = useAuth();
    const iniciales = user?.nombre
        ? user.nombre.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
        : '?';

    const handleLogout = async () => {
        if (window.confirm('¿Cerrar sesión?')) await logout();
    };

    return (
        <div className="pt-4 border-t border-slate-100 mt-4">
            <div className="bg-slate-50 p-3 rounded-2xl flex items-center gap-3">
                {user?.foto ? (
                    <img src={user.foto} alt={user.nombre} className="w-8 h-8 rounded-xl object-cover flex-shrink-0" />
                ) : (
                    <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 font-black text-xs flex-shrink-0">
                        {iniciales}
                    </div>
                )}
                <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black text-slate-700 truncate uppercase">{user?.nombre || 'Usuario'}</p>
                    <p className="text-[8px] font-bold text-slate-400 uppercase italic">{user?.rol || 'Acceso CRM'}</p>
                </div>
                <button
                    onClick={handleLogout}
                    title="Cerrar sesión"
                    className="text-slate-300 hover:text-red-500 transition-colors flex-shrink-0 p-1 rounded-lg hover:bg-red-50"
                >
                    <LogOut size={15} />
                </button>
            </div>
        </div>
    );
}

// ── Contenido interno del sidebar (compartido entre desktop y móvil) ──
function SidebarContent({ onNavClick }) {
    const { user } = useAuth();
    return (
        <>
            {/* Logo */}
            <div className="mb-6 px-2 pt-1">
                <h1 className="text-xl font-black italic text-blue-900 tracking-tighter">
                    EVELUX <span className="text-slate-300 not-italic font-light">CRM</span>
                </h1>
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.25em]">Stratik Cloud System</p>
            </div>

            <nav className="flex-1">
                <SidebarItem icon={LayoutDashboard} label="Dashboard" to="/" onNavClick={onNavClick} />

                <SectionLabel label="Ventas" />
                <SidebarItem icon={Calendar} label="Reservaciones" to="/reservaciones" onNavClick={onNavClick}
                    subItems={[
                        { label: "Ver Reservas", to: "/reservaciones" },
                        { label: "Cotizador", to: "/reservaciones/nueva" },
                        { label: "Límite Cliente", to: "/reservaciones/limite-cliente" },
                        { label: "Abonos", to: "/reservaciones/abonos" },
                    ]}
                />
                <SidebarItem icon={Users} label="Directorios" to="/directorios" onNavClick={onNavClick}
                    subItems={[
                        { label: "Clientes", to: "/directorios/clientes" },
                        { label: "Empresas", to: "/directorios/empresas" },
                        { label: "Proveedores", to: "/directorios/proveedores" },
                        { label: "Paquetes", to: "/directorios/paquetes" },
                    ]}
                />
                <SidebarItem icon={Users} label="Pipeline (Kanban)" to="/clientes/kanban" onNavClick={onNavClick} />

                <SectionLabel label="Reportes" />
                <SidebarItem icon={FileText} label="Reportes" to="/reportes" onNavClick={onNavClick}
                    subItems={[
                        { label: "Ventas Agencia", to: "/reportes/ventas-agencia" },
                        { label: "Pagos Proveedores", to: "/reportes/pagos-proveedores" },
                        { label: "Pasajeros en Tránsito", to: "/reportes/pasajeros-transito" },
                        { label: "Venta de Servicios", to: "/reportes/servicio" },
                        { label: "Difusión", to: "/reportes/difusion" },
                        { label: "Reporte Hoteles", to: "/reportes/hoteles" },
                        { label: "Pagos de Clientes", to: "/reportes/pagos-clientes" },
                    ]}
                />

                {user?.rol !== 'Ventas' && (
                    <>
                        <SectionLabel label="Finanzas" />
                        <SidebarItem icon={Wallet} label="Caja Chica" to="/finanzas/caja-chica" onNavClick={onNavClick} />
                    </>
                )}

                <SectionLabel label="Operación" />
                <SidebarItem icon={CalendarDays} label="Calendario" to="/operacion/calendario" onNavClick={onNavClick} />
                <SidebarItem icon={Ticket} label="Vouchers" to="/operacion/vouchers" onNavClick={onNavClick} />
                <SidebarItem icon={Lock} label="Bloqueos" to="/bloqueos" onNavClick={onNavClick} />

                {user?.rol !== 'Ventas' && (
                    <>
                        <SectionLabel label="Configuración" />
                        <SidebarItem icon={Settings} label="Configuración" to="/configuracion" onNavClick={onNavClick}
                            subItems={[
                                { label: "Usuarios", to: "/configuracion/usuarios" },
                                { label: "Destinos", to: "/configuracion/destinos" },
                                { label: "Hoteles", to: "/configuracion/hoteles" },
                                { label: "Autobuses", to: "/configuracion/autobuses" },
                                { label: "Aerolineas", to: "/configuracion/aerolineas" },
                                { label: "Paquetes", to: "/configuracion/paquetes" },
                                { label: "Bitácora", to: "/configuracion/bitacora" },
                            ]}
                        />
                    </>
                )}
            </nav>

            <FooterUsuario />
        </>
    );
}

// ── Sidebar principal (exportado) ─────────────────────────────────────
export default function Sidebar({ isOpen, onClose }) {
    // Cerrar con tecla Escape
    useEffect(() => {
        const handler = (e) => { if (e.key === 'Escape') onClose?.(); };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [onClose]);

    // Bloquear scroll del body cuando el drawer está abierto en móvil
    useEffect(() => {
        if (isOpen) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = '';
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    return (
        <>
            {/* ── DESKTOP: sidebar fijo siempre visible (md+) ── */}
            <aside className="hidden md:flex w-64 bg-white h-screen border-r border-slate-100 p-4 sticky top-0 overflow-y-auto flex-col shadow-sm flex-shrink-0">
                <SidebarContent />
            </aside>

            {/* ── MÓVIL: overlay + drawer deslizante ── */}
            {/* Overlay oscuro */}
            <div
                onClick={onClose}
                className={`md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
            />

            {/* Drawer */}
            <aside
                className={`md:hidden fixed top-0 left-0 h-full w-72 bg-white z-50 shadow-2xl flex flex-col p-4 transition-transform duration-300 ease-in-out overflow-y-auto ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
            >
                {/* Botón cerrar */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
                >
                    <X size={18} />
                </button>

                <SidebarContent onNavClick={onClose} />
            </aside>
        </>
    );
}

// ── Barra superior móvil (hamburger) ─────────────────────────────────
export function MobileTopBar({ onMenuClick }) {
    const { user } = useAuth();
    const iniciales = user?.nombre
        ? user.nombre.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
        : '?';

    return (
        <header className="md:hidden sticky top-0 z-30 bg-white border-b border-slate-100 shadow-sm flex items-center justify-between px-4 py-3">
            <button
                onClick={onMenuClick}
                className="p-2 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-all"
            >
                <Menu size={22} />
            </button>

            <h1 className="text-base font-black italic text-blue-900 tracking-tighter">
                EVELUX <span className="text-slate-300 not-italic font-light text-sm">CRM</span>
            </h1>

            {user?.foto ? (
                <img src={user.foto} alt="" className="w-8 h-8 rounded-xl object-cover" />
            ) : (
                <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 font-black text-xs">
                    {iniciales}
                </div>
            )}
        </header>
    );
}