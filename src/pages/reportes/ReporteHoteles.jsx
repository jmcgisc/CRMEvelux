import { useEffect, useState } from 'react';
import { db } from '../../firebaseConfig';
import { collection, onSnapshot, query, orderBy, getDocs } from 'firebase/firestore';
import { Hotel, Search, Filter, TrendingUp, BedDouble, Calendar, Star, ChevronDown } from 'lucide-react';

export default function ReporteHoteles() {
    const [reservas, setReservas] = useState([]);
    const [busqueda, setBusqueda] = useState('');
    const [mesFilter, setMesFilter] = useState('todos');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, 'reservas'), orderBy('fechaCreacion', 'desc'));
        const unsub = onSnapshot(q, snap => {
            setReservas(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            setLoading(false);
        });
        return () => unsub();
    }, []);

    // ── Reservas que tienen hotel ─────────────────────────────────────
    const conHotel = reservas.filter(r => r.hotelNombre || r.hotel || r.nombreHotel);

    // ── Filtros ───────────────────────────────────────────────────────
    const filtradas = conHotel.filter(r => {
        const texto = (r.hotelNombre || r.hotel || r.nombreHotel || '').toLowerCase();
        const pax = (r.paxTitular || '').toLowerCase();
        const matchBusq = texto.includes(busqueda.toLowerCase()) || pax.includes(busqueda.toLowerCase());
        if (mesFilter === 'todos') return matchBusq;
        const fecha = r.fechaSalida || r.fechaViaje || '';
        return matchBusq && fecha.startsWith(mesFilter);
    });

    // ── Métricas ──────────────────────────────────────────────────────
    const totalNochesVendidas = filtradas.reduce((a, r) => a + Number(r.noches || r.cantNoches || 0), 0);
    const totalHoteles = [...new Set(filtradas.map(r => r.hotelNombre || r.hotel))].length;
    const totalPax = filtradas.reduce((a, r) => a + Number(r.totalPax || r.numeroPax || 1), 0);
    const totalMonto = filtradas.reduce((a, r) => a + Number(r.montoTotal || 0), 0);

    const fmt = (fecha) => {
        if (!fecha) return '—';
        if (fecha?.toDate) return fecha.toDate().toLocaleDateString('es-MX');
        return fecha;
    };

    const MESES = [
        { val: 'todos', label: 'Todos los meses' },
        { val: new Date().getFullYear() + '-01', label: 'Enero' },
        { val: new Date().getFullYear() + '-02', label: 'Febrero' },
        { val: new Date().getFullYear() + '-03', label: 'Marzo' },
        { val: new Date().getFullYear() + '-04', label: 'Abril' },
        { val: new Date().getFullYear() + '-05', label: 'Mayo' },
        { val: new Date().getFullYear() + '-06', label: 'Junio' },
        { val: new Date().getFullYear() + '-07', label: 'Julio' },
        { val: new Date().getFullYear() + '-08', label: 'Agosto' },
        { val: new Date().getFullYear() + '-09', label: 'Septiembre' },
        { val: new Date().getFullYear() + '-10', label: 'Octubre' },
        { val: new Date().getFullYear() + '-11', label: 'Noviembre' },
        { val: new Date().getFullYear() + '-12', label: 'Diciembre' },
    ];

    return (
        <div className="space-y-6">

            {/* ── Header ── */}
            <div className="flex flex-wrap justify-between items-end gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <div>
                    <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter flex items-center gap-2">
                        Reporte de Hoteles <Hotel className="text-blue-600" size={24} />
                    </h2>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">
                        Reservas con alojamiento · {new Date().getFullYear()}
                    </p>
                </div>
                <button onClick={() => window.print()}
                    className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg">
                    Imprimir
                </button>
            </div>

            {/* ── KPIs ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Reservas c/Hotel', value: filtradas.length, color: 'blue', icon: Hotel },
                    { label: 'Hoteles distintos', value: totalHoteles, color: 'violet', icon: Star },
                    { label: 'Noches vendidas', value: totalNochesVendidas.toLocaleString(), color: 'emerald', icon: BedDouble },
                    { label: 'Total facturado', value: `$${totalMonto.toLocaleString()}`, color: 'amber', icon: TrendingUp },
                ].map(({ label, value, color, icon: Icon }) => (
                    <div key={label} className={`bg-white rounded-2xl border border-slate-100 shadow-sm p-5`}>
                        <div className={`w-9 h-9 rounded-xl bg-${color}-50 flex items-center justify-center mb-3`}>
                            <Icon size={18} className={`text-${color}-500`} />
                        </div>
                        <p className="text-2xl font-black text-slate-800">{value}</p>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{label}</p>
                    </div>
                ))}
            </div>

            {/* ── Barra de herramientas ── */}
            <div className="flex flex-wrap justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm gap-3">
                <div className="flex gap-2 flex-wrap">
                    <select value={mesFilter} onChange={e => setMesFilter(e.target.value)}
                        className="border-2 border-slate-100 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-blue-400">
                        {MESES.map(m => <option key={m.val} value={m.val}>{m.label}</option>)}
                    </select>
                </div>
                <div className="relative w-64">
                    <Search className="absolute left-3 top-2.5 text-slate-300" size={15} />
                    <input type="text" placeholder="Buscar hotel o cliente..."
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-400"
                        onChange={e => setBusqueda(e.target.value)} />
                </div>
            </div>

            {/* ── Tabla ── */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-x-auto">
                <table className="w-full text-left text-[11px] min-w-[900px]">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-black uppercase tracking-widest">
                            <th className="p-4">Folio</th>
                            <th className="p-4">Cliente / Titular</th>
                            <th className="p-4">Hotel</th>
                            <th className="p-4">Destino</th>
                            <th className="p-4 text-center">Noches</th>
                            <th className="p-4 text-center">Pax</th>
                            <th className="p-4 text-center">Plan</th>
                            <th className="p-4">Entrada</th>
                            <th className="p-4">Salida</th>
                            <th className="p-4 text-right">Monto</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {filtradas.length === 0 ? (
                            <tr>
                                <td colSpan={10} className="p-16 text-center text-slate-300 font-bold">
                                    {loading ? 'Cargando...' : 'No hay reservas con hotel registradas'}
                                </td>
                            </tr>
                        ) : filtradas.map(r => (
                            <tr key={r.id} className="hover:bg-blue-50/30 transition-colors">
                                <td className="p-4 font-black text-blue-700">{r.folio || '—'}</td>
                                <td className="p-4">
                                    <p className="font-bold text-slate-700 uppercase">{r.paxTitular || '—'}</p>
                                    <p className="text-[9px] text-slate-400">{fmt(r.fechaCreacion)}</p>
                                </td>
                                <td className="p-4">
                                    <p className="font-bold text-slate-800">{r.hotelNombre || r.hotel || r.nombreHotel || '—'}</p>
                                </td>
                                <td className="p-4 font-medium text-slate-600">{r.destinoNombre || r.destino || '—'}</td>
                                <td className="p-4 text-center font-black text-slate-700">{r.noches || r.cantNoches || '—'}</td>
                                <td className="p-4 text-center font-bold text-slate-600">{r.totalPax || r.numeroPax || 1}</td>
                                <td className="p-4 text-center">
                                    <span className="bg-blue-50 text-blue-700 border border-blue-100 text-[9px] font-black uppercase px-2 py-0.5 rounded-full">
                                        {r.plan || r.tipoHabitacion || 'N/D'}
                                    </span>
                                </td>
                                <td className="p-4 font-medium text-slate-600">{fmt(r.fechaEntrada || r.fechaSalida)}</td>
                                <td className="p-4 font-medium text-slate-600">{fmt(r.fechaRegreso || r.fechaRetorno)}</td>
                                <td className="p-4 text-right font-black text-slate-800">${Number(r.montoTotal || 0).toLocaleString()} <span className="text-[9px] text-slate-400">{r.moneda || 'MXN'}</span></td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot className="bg-slate-50 border-t-2 border-slate-100 font-black text-slate-700">
                        <tr>
                            <td colSpan={9} className="p-4 text-right text-xs uppercase tracking-widest">Total Facturado:</td>
                            <td className="p-4 text-right text-sm">${totalMonto.toLocaleString()} <span className="text-[9px] font-normal text-slate-400">MXN</span></td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            <p className="text-center text-[10px] font-black text-slate-300 uppercase tracking-widest">
                {filtradas.length} registros · Evelux CRM · Stratik Cloud
            </p>
        </div>
    );
}
