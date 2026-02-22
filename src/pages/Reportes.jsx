import { useEffect, useState } from 'react';
import { db } from '../firebaseConfig';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { FileBarChart, Download, Filter, ArrowUpRight } from 'lucide-react';

export default function Reportes() {
    const [reservas, setReservas] = useState([]);
    const [reporteB2B, setReporteB2B] = useState([]);

    useEffect(() => {
        const unsub = onSnapshot(collection(db, "reservas"), (snap) => {
            const docs = snap.docs.map(doc => doc.data());
            setReservas(docs);

            // Lógica para agrupar ventas por Proveedor B2B
            const agrupado = docs.reduce((acc, res) => {
                const prov = res.nombreProveedor || 'Directo';
                if (!acc[prov]) {
                    acc[prov] = { nombre: prov, total: 0, count: 0 };
                }
                acc[prov].total += Number(res.montoTotal || 0);
                acc[prov].count += 1;
                return acc;
            }, {});

            setReporteB2B(Object.values(agrupado).sort((a, b) => b.total - a.total));
        });
        return () => unsub();
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-black text-slate-800 uppercase italic tracking-tighter">Inteligencia de Negocios</h2>
                    <p className="text-sm text-slate-500 font-medium">Análisis de ventas y liquidaciones B2B para Evelux</p>
                </div>
                <button className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-slate-700 transition-all">
                    <Download size={16} /> Exportar Excel
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Tabla de Resumen por Proveedor */}
                <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-50 flex justify-between items-center">
                        <h3 className="font-bold text-slate-700 flex items-center gap-2">
                            <FileBarChart size={18} className="text-blue-600" /> Ventas por Operadora / Hotel
                        </h3>
                        <Filter size={16} className="text-slate-400 cursor-pointer" />
                    </div>
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            <tr>
                                <th className="p-4">Socio Comercial</th>
                                <th className="p-4 text-center">Reservas</th>
                                <th className="p-4 text-right">Monto Total Bruto</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {reporteB2B.map((item, index) => (
                                <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="p-4 font-bold text-slate-700">{item.nombre}</td>
                                    <td className="p-4 text-center font-medium text-slate-500">{item.count}</td>
                                    <td className="p-4 text-right font-black text-blue-600">
                                        ${item.total.toLocaleString()} <span className="text-[10px] text-slate-300">MXN</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Card de Insights Rápidos */}
                <div className="space-y-6">
                    <div className="bg-indigo-600 rounded-3xl p-6 text-white shadow-xl shadow-indigo-100 relative overflow-hidden">
                        <h4 className="text-xs font-bold uppercase opacity-60 mb-1">Mejor Socio Comercial</h4>
                        <p className="text-2xl font-black mb-4 truncate">{reporteB2B[0]?.nombre || 'Cargando...'}</p>
                        <div className="flex items-center gap-2 text-xs font-bold bg-white/20 w-fit px-3 py-1 rounded-full">
                            <ArrowUpRight size={14} /> +12% vs mes anterior
                        </div>
                        <div className="absolute -bottom-4 -right-4 opacity-10">
                            <FileBarChart size={120} />
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
                        <h4 className="font-bold text-slate-800 mb-4 uppercase text-xs tracking-widest border-b pb-2">Próximos Vencimientos</h4>
                        <div className="space-y-4">
                            <p className="text-[11px] text-slate-400 italic">No hay pagos pendientes a proveedores para las próximas 48 horas.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}