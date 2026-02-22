import { useEffect, useState } from 'react';
import { db } from '../../firebaseConfig';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { ShoppingCart, Filter, Download, Search, CheckCircle2 } from 'lucide-react';

export default function ReporteServicio() {
    const [servicios, setServicios] = useState([]);
    const [busqueda, setBusqueda] = useState("");

    useEffect(() => {
        const q = query(collection(db, "reservas"), orderBy("fechaCreacion", "desc"));
        const unsub = onSnapshot(q, (snap) => {
            setServicios(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => unsub();
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter flex items-center gap-2">
                        Venta de Servicios <ShoppingCart className="text-blue-600" size={24} />
                    </h2>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest text-[10px]">Análisis detallado por producto y confirmación</p>
                </div>
                <button className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg hover:bg-blue-700 transition-all text-xs">
                    <Filter size={16} /> Filtrar Reporte
                </button>
            </div>

            {/* Acciones y Buscador */}
            <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex gap-2">
                    <button className="px-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-black uppercase hover:bg-slate-100 transition-all">Excel</button>
                    <button className="px-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-black uppercase hover:bg-slate-100 transition-all">PDF</button>
                    <button className="px-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-black uppercase hover:bg-slate-100 transition-all">Imprimir</button>
                </div>
                <div className="relative w-72">
                    <Search className="absolute left-3 top-2.5 text-slate-300" size={16} />
                    <input
                        type="text"
                        placeholder="Buscar por folio, cliente o clave..."
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500"
                        onChange={(e) => setBusqueda(e.target.value)}
                    />
                </div>
            </div>

            {/* Tabla Detallada Estilo Reservantia */}
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-x-auto">
                <table className="w-full text-left text-[10px] min-w-[1400px]">
                    <thead>
                        <tr className="bg-slate-50 border-b border-gray-200 text-slate-400 font-black uppercase tracking-widest">
                            <th className="p-4 text-center">Folio</th>
                            <th className="p-4">Estatus</th>
                            <th className="p-4">Fechas Estancia</th>
                            <th className="p-4">Creación Reserva</th>
                            <th className="p-4">Producto</th>
                            <th className="p-4">Proveedores</th>
                            <th className="p-4">Cliente</th>
                            <th className="p-4">Pax Tit.</th>
                            <th className="p-4">Vendedor</th>
                            <th className="p-4">Confirmación</th>
                            <th className="p-4">Clave Conf.</th>
                            <th className="p-4 text-right">Total Servicio</th>
                            <th className="p-4 text-right">Total Reserv.</th>
                            <th className="p-4 text-right">Abonos Cliente</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {servicios.filter(s =>
                            s.folio?.toLowerCase().includes(busqueda.toLowerCase()) ||
                            s.paxTitular?.toLowerCase().includes(busqueda.toLowerCase())
                        ).map((s) => (
                            <tr key={s.id} className="hover:bg-blue-50/30 transition-colors">
                                <td className="p-4 font-black text-blue-700 text-center">{s.folio}</td>
                                <td className="p-4">
                                    <span className="bg-orange-50 text-orange-600 px-2 py-0.5 rounded-md font-bold uppercase text-[9px] border border-orange-100 flex items-center gap-1 w-fit">
                                        <CheckCircle2 size={10} /> Cerrada
                                    </span>
                                </td>
                                <td className="p-4 font-medium text-slate-600">{s.fechaInicio} <br /> {s.fechaFin}</td>
                                <td className="p-4 text-slate-400 font-bold">{s.fechaCreacion?.toDate().toLocaleDateString() || '17/09/2025'}</td>
                                <td className="p-4 font-bold text-slate-700 uppercase">{s.tipoProducto || 'Hospedaje'}</td>
                                <td className="p-4 font-black text-slate-500 uppercase">{s.empresaNombre || 'Socio B2B'}</td>
                                <td className="p-4 font-medium text-blue-600 uppercase">{s.clienteNombre || 'Juan Perez'}</td>
                                <td className="p-4 font-medium text-slate-600 uppercase">{s.paxTitular}</td>
                                <td className="p-4 font-bold text-slate-400 uppercase">Administrador</td>
                                <td className="p-4 font-bold text-slate-500 uppercase">Soporte</td>
                                <td className="p-4 font-black text-blue-800 tracking-tighter italic">EVELUX-{s.id.slice(0, 5).toUpperCase()}</td>
                                <td className="p-4 text-right font-bold text-slate-700">${Number(s.montoTotal).toLocaleString()} MXN</td>
                                <td className="p-4 text-right font-black text-slate-800">${Number(s.montoTotal).toLocaleString()} MXN</td>
                                <td className="p-4 text-right font-black text-emerald-600 text-[11px] bg-emerald-50/30">
                                    ${Number(s.pagado || s.montoTotal).toLocaleString()} MXN
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="flex justify-between items-center text-[10px] font-black text-slate-400 px-4 uppercase tracking-widest">
                <p>Mostrando {servicios.length} registros individuales de servicio</p>
                <p>Evelux Intelligence Unit - Stratik Group</p>
            </div>
        </div>
    );
}