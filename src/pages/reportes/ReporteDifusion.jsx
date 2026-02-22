import { useEffect, useState } from 'react';
import { db } from '../../firebaseConfig';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { Megaphone, Share2, Target, BarChart3, Search, Filter, TrendingUp } from 'lucide-react';

export default function ReporteDifusion() {
    const [campanas, setCampanas] = useState([]);
    const [busqueda, setBusqueda] = useState("");
    const [metricas, setMetricas] = useState({ totalLeads: 0, conversion: 0 });

    useEffect(() => {
        const q = query(collection(db, "reservas"), orderBy("fechaCreacion", "desc"));
        const unsub = onSnapshot(q, (snap) => {
            const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setCampanas(data);

            // Simulación de métricas de marketing
            setMetricas({
                totalLeads: data.length * 4, // Estimado de prospectos
                conversion: ((data.length / (data.length * 4)) * 100).toFixed(1)
            });
        });
        return () => unsub();
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter flex items-center gap-2">
                        Reporte de Difusión <Megaphone className="text-blue-600" size={24} />
                    </h2>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest text-[10px]">Análisis de Origen de Venta y Canales de Captación</p>
                </div>
                <button className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg hover:bg-blue-700 transition-all text-xs uppercase tracking-widest">
                    <Target size={16} /> Nueva Campaña
                </button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase">Impactos Totales</p>
                        <p className="text-2xl font-black text-slate-800">{metricas.totalLeads}</p>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-2xl text-blue-600"><Share2 size={24} /></div>
                </div>
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase">Reservas Convertidas</p>
                        <p className="text-2xl font-black text-emerald-600">{campanas.length}</p>
                    </div>
                    <div className="bg-emerald-50 p-3 rounded-2xl text-emerald-600"><TrendingUp size={24} /></div>
                </div>
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase">% Tasa de Conversión</p>
                        <p className="text-2xl font-black text-orange-500">{metricas.conversion}%</p>
                    </div>
                    <div className="bg-orange-50 p-3 rounded-2xl text-orange-600"><BarChart3 size={24} /></div>
                </div>
            </div>

            {/* Tabla de Canales */}
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-50 flex justify-between items-center">
                    <h3 className="text-sm font-black text-slate-700 uppercase italic">Desglose por Fuente de Origen</h3>
                    <div className="relative w-64">
                        <Search className="absolute left-3 top-2 text-slate-300" size={14} />
                        <input
                            type="text"
                            placeholder="Filtrar canal..."
                            className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border-none rounded-lg text-xs outline-none"
                            onChange={(e) => setBusqueda(e.target.value)}
                        />
                    </div>
                </div>
                <table className="w-full text-left text-[11px]">
                    <thead>
                        <tr className="bg-slate-50/50 text-slate-400 font-black uppercase tracking-widest border-b">
                            <th className="p-5">Canal de Difusión</th>
                            <th className="p-5">Campaña / Fuente</th>
                            <th className="p-5 text-center">Reservas</th>
                            <th className="p-5 text-right">Monto Generado</th>
                            <th className="p-5 text-center">Estatus</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {/* Ejemplo de filas basadas en tus datos */}
                        {[
                            { canal: 'WhatsApp Business', fuente: 'Campaña Primavera', res: 12, monto: 145000, status: 'Activo' },
                            { canal: 'Facebook Ads', fuente: 'Retargeting Cancún', res: 8, monto: 92000, status: 'Activo' },
                            { canal: 'B2B Alianzas', fuente: 'Agencias Afiliadas', res: 24, monto: 410000, status: 'Pausado' },
                            { canal: 'Email Marketing', fuente: 'Newsletter Mensual', res: 5, monto: 34000, status: 'Finalizado' }
                        ].filter(c => c.canal.toLowerCase().includes(busqueda.toLowerCase())).map((c, i) => (
                            <tr key={i} className="hover:bg-blue-50/20 transition-colors group">
                                <td className="p-5 font-black text-slate-700 uppercase">{c.canal}</td>
                                <td className="p-5 font-bold text-blue-600 italic">{c.fuente}</td>
                                <td className="p-5 text-center font-black text-slate-800">{c.res}</td>
                                <td className="p-5 text-right font-black text-slate-800 text-sm">
                                    ${c.monto.toLocaleString()} <span className="text-[9px] text-slate-400">MXN</span>
                                </td>
                                <td className="p-5 text-center">
                                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${c.status === 'Activo' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'
                                        }`}>
                                        {c.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="flex justify-between items-center text-[10px] font-black text-slate-400 px-4 uppercase tracking-widest">
                <p>Análisis de rendimiento publicitario - Evelux Business Unit</p>
                <p>Stratik Cloud Intelligence 2026</p>
            </div>
        </div>
    );
}