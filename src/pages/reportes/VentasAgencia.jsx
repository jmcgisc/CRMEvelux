import { useEffect, useState } from 'react';
import { db } from '../../firebaseConfig';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { FileText, Filter, Download, Printer, Search, TrendingUp } from 'lucide-react';

export default function VentasAgencia() {
    const [reservas, setReservas] = useState([]);
    const [totales, setTotales] = useState({ pesos: 0, dolares: 0 });
    const [busqueda, setBusqueda] = useState("");

    useEffect(() => {
        const q = query(collection(db, "reservas"), orderBy("fechaCreacion", "desc"));
        const unsub = onSnapshot(q, (snap) => {
            const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setReservas(data);

            // Calcular Totales Generales
            const sumas = data.reduce((acc, res) => {
                const monto = Number(res.montoTotal || 0);
                if (res.moneda === 'USD') acc.dolares += monto;
                else acc.pesos += monto;
                return acc;
            }, { pesos: 0, dolares: 0 });
            setTotales(sumas);
        });
        return () => unsub();
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter flex items-center gap-2">
                        Reporte de Ventas Diario <TrendingUp className="text-blue-600" size={24} />
                    </h2>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Consolidado General de Operaciones</p>
                </div>
                <div className="flex gap-2">
                    <button className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg">
                        <Filter size={16} /> Filtro Reportes
                    </button>
                </div>
            </div>

            {/* Acciones Rápidas y Buscador */}
            <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex gap-2">
                    <button className="px-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-black hover:bg-slate-100 transition-all uppercase">Excel</button>
                    <button className="px-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-black hover:bg-slate-100 transition-all uppercase">PDF</button>
                    <button className="px-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-black hover:bg-slate-100 transition-all uppercase">Imprimir</button>
                </div>
                <div className="relative w-64">
                    <Search className="absolute left-3 top-2.5 text-slate-300" size={16} />
                    <input
                        type="text"
                        placeholder="Buscar por folio o pasajero..."
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500"
                        onChange={(e) => setBusqueda(e.target.value)}
                    />
                </div>
            </div>

            {/* Tabla Estilo Reservantia */}
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-x-auto">
                <table className="w-full text-left text-[11px] min-w-[1200px]">
                    <thead>
                        <tr className="bg-slate-50 border-b border-gray-200 text-slate-400 font-black uppercase tracking-tighter">
                            <th className="p-4">Folio</th>
                            <th className="p-4 text-center">Estatus</th>
                            <th className="p-4">Cliente / Titular</th>
                            <th className="p-4">Destino / Hotel</th>
                            <th className="p-4">Asesor</th>
                            <th className="p-4">Vencimiento</th>
                            <th className="p-4">Proveedores</th>
                            <th className="p-4">Moneda</th>
                            <th className="p-4 text-right">Venta Total</th>
                            <th className="p-4 text-right">Saldo Prov.</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {reservas.filter(r => r.folio.toLowerCase().includes(busqueda.toLowerCase()) || r.paxTitular.toLowerCase().includes(busqueda.toLowerCase())).map((r) => (
                            <tr key={r.id} className="hover:bg-blue-50/30 transition-colors">
                                <td className="p-4 font-black text-blue-700">{r.folio}</td>
                                <td className="p-4 text-center">
                                    <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold uppercase text-[9px]">Confirmada</span>
                                </td>
                                <td className="p-4">
                                    <div className="font-bold text-slate-700 uppercase">{r.paxTitular}</div>
                                    <div className="text-[9px] text-slate-400 uppercase italic">Registro: {r.fechaCreacion?.toDate().toLocaleDateString()}</div>
                                </td>
                                <td className="p-4">
                                    <div className="font-bold text-slate-600 uppercase">{r.destinoNombre}</div>
                                    <div className="text-[9px] text-blue-500 font-bold uppercase">{r.hotelNombre}</div>
                                </td>
                                <td className="p-4 font-medium text-slate-500">Admin Evelux</td>
                                <td className="p-4 font-bold text-orange-600">{r.fechaLimite || '---'}</td>
                                <td className="p-4 font-medium text-slate-400">B2B Operadora</td>
                                <td className="p-4 text-center font-bold text-slate-500">{r.moneda}</td>
                                <td className="p-4 text-right font-black text-slate-800 text-sm">${Number(r.montoTotal).toLocaleString()}</td>
                                <td className="p-4 text-right font-bold text-red-400">${(Number(r.montoTotal) * 0.8).toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                    {/* FOOTER DE TOTALES */}
                    <tfoot className="bg-slate-50/50 font-black text-blue-900 border-t-2 border-slate-100">
                        <tr>
                            <td colSpan="8" className="p-4 text-right uppercase tracking-widest text-xs">Total Venta General Pesos:</td>
                            <td className="p-4 text-right text-sm">${totales.pesos.toLocaleString()} <span className="text-[9px]">MXN</span></td>
                            <td></td>
                        </tr>
                        <tr>
                            <td colSpan="8" className="p-4 text-right uppercase tracking-widest text-xs">Total Venta General Dólares:</td>
                            <td className="p-4 text-right text-sm text-blue-600">${totales.dolares.toLocaleString()} <span className="text-[9px]">USD</span></td>
                            <td></td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            <div className="flex justify-between items-center text-[10px] font-black text-slate-400 px-4 uppercase">
                <p>Mostrando {reservas.length} registros en total</p>
                <p>Evelux CRM v4.3.1 - Stratik Cloud</p>
            </div>
        </div>
    );
}