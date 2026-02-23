import { useEffect, useState } from 'react';
import { db } from '../firebaseConfig';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import {
    TrendingUp, Users, Calendar, Wallet,
    ArrowUpRight, Target, Briefcase, ChevronRight,
    CreditCard, ClipboardList, CheckCircle, Clock, AlertCircle,
    PlusCircle, Edit, Trash2, Eye
} from 'lucide-react';
import { Link } from 'react-router-dom';
import RankingVendedores from '../components/dashboard/RankingVendedores';
import GraficaGastos from '../components/dashboard/GraficaGastos';

export default function Dashboard() {
    const [stats, setStats] = useState({ ventasMes: 0, reservasActivas: 0, prospectosNuevos: 0, metaTotal: 0 });
    const [empleados, setEmpleados] = useState([]);
    const [movimientosCaja, setMovimientosCaja] = useState([]);
    const [pagosClientes, setPagosClientes] = useState([]);
    const [logsRecientes, setLogsRecientes] = useState([]);

    useEffect(() => {
        // Escuchar Reservas para Ventas
        const unsubRes = onSnapshot(collection(db, "reservas"), (snap) => {
            const data = snap.docs.map(d => d.data());
            const total = data.reduce((acc, r) => acc + Number(r.montoTotal || 0), 0);
            setStats(prev => ({ ...prev, ventasMes: total, reservasActivas: snap.size }));
        });

        // Escuchar Empleados para Metas
        const unsubEmp = onSnapshot(collection(db, "empleados"), (snap) => {
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            const metaGral = data.reduce((acc, e) => acc + Number(e.meta || 0), 0);
            setEmpleados(data);
            setStats(prev => ({ ...prev, metaTotal: metaGral, prospectosNuevos: snap.size }));
        });

        // Escuchar Caja Chica para gráfica de gastos
        const unsubCaja = onSnapshot(collection(db, 'caja_chica'), snap =>
            setMovimientosCaja(snap.docs.map(d => ({ id: d.id, ...d.data() })))
        );

        // Pagos de Clientes (mes actual)
        const unsubPagos = onSnapshot(
            query(collection(db, 'pagos_clientes'), orderBy('fecha', 'desc')),
            snap => setPagosClientes(snap.docs.map(d => ({ id: d.id, ...d.data() })))
        );

        // Logs / Bitácora
        const unsubLogs = onSnapshot(
            query(collection(db, 'logs'), orderBy('fecha', 'desc')),
            snap => setLogsRecientes(snap.docs.slice(0, 12).map(d => ({ id: d.id, ...d.data() })))
        );

        return () => { unsubRes(); unsubEmp(); unsubCaja(); unsubPagos(); unsubLogs(); };
    }, []);

    const porcentajeMeta = ((stats.ventasMes / stats.metaTotal) * 100).toFixed(1);

    return (
        <div className="space-y-8 pb-10">
            {/* Bienvenida CEO */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">
                        Panel de Control <span className="text-blue-600 italic">Evelux</span>
                    </h1>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
                        Bienvenido, José Manuel Carreiro Galicia
                    </p>
                </div>
                <div className="bg-white px-4 py-2 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
                    <div className="text-right">
                        <p className="text-[9px] font-black text-slate-400 uppercase">Estatus Global</p>
                        <p className="text-xs font-bold text-emerald-500 uppercase">Operación Activa</p>
                    </div>
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></div>
                </div>
            </div>

            {/* Metas Principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                    title="Ventas del Mes"
                    value={`$${stats.ventasMes.toLocaleString()}`}
                    icon={<Wallet />}
                    color="text-blue-600"
                    bg="bg-blue-50"
                />
                <MetricCard
                    title="Reservas Totales"
                    value={stats.reservasActivas}
                    icon={<Briefcase />}
                    color="text-purple-600"
                    bg="bg-purple-50"
                />
                <MetricCard
                    title="Meta Colectiva"
                    value={`$${stats.metaTotal.toLocaleString()}`}
                    icon={<Target />}
                    color="text-orange-600"
                    bg="bg-orange-50"
                />
                <MetricCard
                    title="Avance de Meta"
                    value={`${porcentajeMeta}%`}
                    icon={<TrendingUp />}
                    color="text-emerald-600"
                    bg="bg-emerald-50"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Ranking de Vendedores */}
                <div className="lg:col-span-2 bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="font-black text-slate-800 uppercase text-sm tracking-widest">Rendimiento por Asesor</h3>
                        <button className="text-[10px] font-black text-blue-600 uppercase hover:underline">Ver Reporte Detallado</button>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Columna izquierda: Ranking de ventas (2/3 de ancho) */}
                        <div className="lg:col-span-2">
                            <RankingVendedores empleados={empleados} />
                        </div>

                        {/* Columna derecha: Gráfica de Gastos (1/3 de ancho) */}
                        <div>
                            <GraficaGastos movimientos={movimientosCaja} />
                        </div>
                    </div>
                </div>

                {/* Accesos Rápidos */}
                <div className="space-y-6">
                    <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden group">
                        <div className="relative z-10">
                            <h3 className="font-black uppercase text-xs tracking-widest opacity-60 mb-2">Acción Rápida</h3>
                            <p className="text-xl font-bold leading-tight mb-6 text-blue-200">¿Listo para una nueva cotización?</p>
                            <button className="w-full bg-blue-600 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 hover:bg-blue-500 transition-all">
                                Crear Propuesta <ArrowUpRight size={14} />
                            </button>
                        </div>
                        <Target className="absolute -bottom-10 -right-10 text-white/5 w-40 h-40 group-hover:scale-110 transition-transform duration-500" />
                    </div>

                    <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
                        <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest mb-6">Próximos Check-ins</h3>
                        <div className="space-y-4">
                            <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm">
                                    <Calendar size={18} />
                                </div>
                                <div>
                                    <p className="text-[11px] font-black text-slate-700 uppercase">Reserva Cancun</p>
                                    <p className="text-[9px] text-slate-400 font-bold">24 FEB 2026</p>
                                </div>
                                <ChevronRight size={14} className="ml-auto text-slate-300" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* ── Fila inferior: Pagos del mes + Bitácora ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* ── Pagos y Anticipos del Mes ── */}
                <PagosMes pagos={pagosClientes} />

                {/* ── Bitácora Mensual ── */}
                <BitacoraMensual logs={logsRecientes} />

            </div>
        </div>
    );
}

function MetricCard({ title, value, icon, color, bg }) {
    return (
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-all group">
            <div className="flex justify-between items-start mb-4">
                <div className={`${bg} ${color} p-3 rounded-2xl group-hover:scale-110 transition-transform`}>
                    {icon}
                </div>
                <div className="text-emerald-500 flex items-center text-[10px] font-black">
                    +12% <ArrowUpRight size={12} />
                </div>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
            <h4 className="text-2xl font-black text-slate-800 tracking-tighter">{value}</h4>
        </div>
    );
}

// ── Widget: Pagos y Anticipos del Mes ────────────────────────────────
function PagosMes({ pagos }) {
    const hoy = new Date();
    const mesActual = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;

    const pagosMes = pagos.filter(p => {
        const f = typeof p.fecha === 'string' ? p.fecha : (p.fecha?.toDate?.()?.toISOString?.()?.slice(0, 7) || '');
        return f.startsWith(mesActual);
    });

    const cobrados = pagosMes.filter(p => p.estatus === 'pagado').reduce((a, p) => a + Number(p.monto || 0), 0);
    const pendientes = pagosMes.filter(p => p.estatus !== 'pagado').reduce((a, p) => a + Number(p.monto || 0), 0);
    const totalMes = cobrados + pendientes;

    const ESTATUS_ICON = {
        pagado: <CheckCircle size={12} className="text-emerald-500" />,
        parcial: <Clock size={12} className="text-amber-500" />,
        pendiente: <AlertCircle size={12} className="text-red-400" />,
    };

    return (
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-7 space-y-5">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="bg-emerald-50 p-2.5 rounded-xl">
                        <CreditCard size={18} className="text-emerald-600" />
                    </div>
                    <div>
                        <h3 className="font-black text-slate-800 text-sm uppercase tracking-tight">Pagos y Anticipos</h3>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Ganancias ingresadas en el mes</p>
                    </div>
                </div>
                <Link to="/reportes/pagos-clientes"
                    className="text-[10px] font-black text-emerald-600 hover:underline uppercase">
                    Ver todo →
                </Link>
            </div>

            <div className="grid grid-cols-3 gap-3">
                <div className="bg-emerald-50 rounded-2xl p-3 text-center">
                    <p className="text-base font-black text-emerald-700">${cobrados.toLocaleString()}</p>
                    <p className="text-[9px] font-black text-emerald-500 uppercase">Cobrado</p>
                </div>
                <div className="bg-amber-50 rounded-2xl p-3 text-center">
                    <p className="text-base font-black text-amber-700">${pendientes.toLocaleString()}</p>
                    <p className="text-[9px] font-black text-amber-500 uppercase">Pendiente</p>
                </div>
                <div className="bg-blue-50 rounded-2xl p-3 text-center">
                    <p className="text-base font-black text-blue-700">{pagosMes.length}</p>
                    <p className="text-[9px] font-black text-blue-500 uppercase">Registros</p>
                </div>
            </div>

            <div className="space-y-2">
                {pagosMes.length === 0 ? (
                    <p className="text-slate-300 text-xs text-center py-4 font-semibold">Sin pagos registrados este mes</p>
                ) : pagosMes.slice(0, 5).map(p => (
                    <div key={p.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors">
                        <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                            {ESTATUS_ICON[p.estatus] || ESTATUS_ICON.pendiente}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-black text-slate-700 truncate uppercase">{p.cliente}</p>
                            <p className="text-[9px] text-slate-400">{p.concepto || p.folio || '—'}</p>
                        </div>
                        <p className="text-sm font-black text-slate-800">${Number(p.monto || 0).toLocaleString()}</p>
                    </div>
                ))}
            </div>

            <div className="border-t border-slate-50 pt-3 flex justify-between items-center">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total del mes</span>
                <span className="text-xl font-black text-slate-800">${totalMes.toLocaleString()} <span className="text-[10px] font-normal text-slate-400">MXN</span></span>
            </div>
        </div>
    );
}

// ── Widget: Bitácora Mensual ─────────────────────────────────────────
function BitacoraMensual({ logs }) {
    const hoy = new Date();
    const mesLabel = hoy.toLocaleString('es-MX', { month: 'long', year: 'numeric' });

    const TIPO_CONFIG = {
        CREAR: { icon: <PlusCircle size={11} />, color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
        EDITAR: { icon: <Edit size={11} />, color: 'bg-amber-50 text-amber-600 border-amber-100' },
        ELIMINAR: { icon: <Trash2 size={11} />, color: 'bg-red-50 text-red-600 border-red-100' },
        VER: { icon: <Eye size={11} />, color: 'bg-blue-50 text-blue-600 border-blue-100' },
        INFO: { icon: <ClipboardList size={11} />, color: 'bg-slate-100 text-slate-500 border-slate-200' },
    };

    return (
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-7 space-y-5">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="bg-blue-50 p-2.5 rounded-xl">
                        <ClipboardList size={18} className="text-blue-600" />
                    </div>
                    <div>
                        <h3 className="font-black text-slate-800 text-sm uppercase tracking-tight">Bitácora Mensual</h3>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest capitalize">{mesLabel}</p>
                    </div>
                </div>
                <Link to="/configuracion/bitacora"
                    className="text-[10px] font-black text-blue-600 hover:underline uppercase">
                    Ver Bitácora Global →
                </Link>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {logs.length === 0 ? (
                    <p className="text-slate-300 text-xs text-center py-6 font-semibold">Sin movimientos registrados</p>
                ) : logs.map(log => {
                    const cfg = TIPO_CONFIG[log.tipo] || TIPO_CONFIG.INFO;
                    return (
                        <div key={log.id} className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-[9px] font-black uppercase flex-shrink-0 mt-0.5 ${cfg.color}`}>
                                {cfg.icon} {log.tipo}
                            </span>
                            <div className="flex-1 min-w-0">
                                <p className="text-[11px] font-bold text-slate-700 truncate">{log.accion}</p>
                                <p className="text-[9px] text-slate-400 truncate">{log.modulo} · {log.detalle}</p>
                            </div>
                            <p className="text-[9px] text-slate-300 flex-shrink-0 whitespace-nowrap">{String(log.fecha || '').slice(0, 10)}</p>
                        </div>
                    );
                })}
            </div>

            <div className="border-t border-slate-50 pt-3 flex justify-between items-center">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Movimientos recientes</span>
                <span className="text-xl font-black text-slate-800">{logs.length}</span>
            </div>
        </div>
    );
}