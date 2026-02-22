import { useEffect, useState } from 'react';
import { db } from '../firebaseConfig';
import { collection, onSnapshot, query } from 'firebase/firestore';
import {
    TrendingUp, Users, Calendar, Wallet,
    ArrowUpRight, Target, Briefcase, ChevronRight
} from 'lucide-react';
import RankingVendedores from '../components/dashboard/RankingVendedores';
import GraficaGastos from '../components/dashboard/GraficaGastos';

export default function Dashboard() {
    const [stats, setStats] = useState({
        ventasMes: 0,
        reservasActivas: 0,
        prospectosNuevos: 0,
        metaTotal: 0
    });
    const [empleados, setEmpleados] = useState([]);
    const [movimientosCaja, setMovimientosCaja] = useState([]);

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
        const unsubCaja = onSnapshot(collection(db, "caja_chica"), (snap) => {
            setMovimientosCaja(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        return () => { unsubRes(); unsubEmp(); unsubCaja(); };
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