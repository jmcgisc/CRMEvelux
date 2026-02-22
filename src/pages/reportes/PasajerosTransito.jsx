import { useEffect, useState } from 'react';
import { db } from '../../firebaseConfig';
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { Bus, MapPin, Phone, Search, Filter, Download, Calendar } from 'lucide-react';

export default function PasajerosTransito() {
    const [pasajeros, setPasajeros] = useState([]);
    const [busqueda, setBusqueda] = useState("");

    useEffect(() => {
        // En una app real, aquí filtraríamos donde fechaInicio <= hoy <= fechaFin
        const q = query(collection(db, "reservas"), orderBy("fechaInicio", "asc"));

        const unsub = onSnapshot(q, (snap) => {
            setPasajeros(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => unsub();
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter flex items-center gap-2">
                        Pasajeros en Tránsito <Bus className="text-blue-600" size={24} />
                    </h2>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Monitoreo de servicios activos y llegadas</p>
                </div>
                <button className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg hover:bg-blue-700 transition-all">
                    <Filter size={18} /> Filtrar Pasajeros
                </button>
            </div>

            {/* Buscador y Exportar */}
            <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex gap-2">
                    <button className="px-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-black uppercase hover:bg-slate-100">Excel</button>
                    <button className="px-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-black uppercase hover:bg-slate-100">PDF</button>
                </div>
                <div className="relative w-72">
                    <Search className="absolute left-3 top-2.5 text-slate-300" size={16} />
                    <input
                        type="text"
                        placeholder="Buscar por pasajero o destino..."
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500"
                        onChange={(e) => setBusqueda(e.target.value)}
                    />
                </div>
            </div>

            {/* Tabla de Tránsito */}
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-x-auto">
                <table className="w-full text-left text-[11px] min-w-[1100px]">
                    <thead>
                        <tr className="bg-slate-50 border-b border-gray-200 text-slate-400 font-black uppercase tracking-tighter">
                            <th className="p-5">Folio</th>
                            <th className="p-5">Estatus</th>
                            <th className="p-5">Fechas y Servicios</th>
                            <th className="p-5">Inicio & Fin</th>
                            <th className="p-5 text-center"># Pax</th>
                            <th className="p-5">Pasajero Titular</th>
                            <th className="p-5">Cliente / Teléfono</th>
                            <th className="p-5">Proveedor</th>
                            <th className="p-5">Destino</th>
                            <th className="p-5 text-right">Total Reserva</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {pasajeros.filter(p => p.paxTitular.toLowerCase().includes(busqueda.toLowerCase()) || p.destinoNombre?.toLowerCase().includes(busqueda.toLowerCase())).map((p) => (
                            <tr key={p.id} className="hover:bg-blue-50/30 transition-colors">
                                <td className="p-5 font-black text-blue-700">{p.folio}</td>
                                <td className="p-5">
                                    <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-bold uppercase text-[9px]">En Tránsito</span>
                                </td>
                                <td className="p-5">
                                    <div className="font-bold text-slate-700">Hospedaje: {p.hotelNombre || 'N/A'}</div>
                                    <div className="text-blue-500 font-medium italic">{p.fechaInicio} - {p.fechaFin}</div>
                                </td>
                                <td className="p-5 font-medium text-slate-500">{p.fechaInicio} / {p.fechaFin}</td>
                                <td className="p-5 text-center font-black text-slate-700">{p.paxCantidad || 1}</td>
                                <td className="p-5 font-bold text-slate-800 uppercase">{p.paxTitular}</td>
                                <td className="p-5">
                                    <div className="font-medium text-slate-600 truncate max-w-[120px]">ID Cliente: {p.clienteId?.slice(-5)}</div>
                                    <div className="flex items-center gap-1 text-emerald-600 font-bold"><Phone size={10} /> 55XXXXXXXX</div>
                                </td>
                                <td className="p-5 font-bold text-slate-500 uppercase">{p.empresaNombre || 'Socio B2B'}</td>
                                <td className="p-5">
                                    <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded font-bold uppercase text-[9px]">{p.destinoNombre}</span>
                                </td>
                                <td className="p-5 text-right font-black text-slate-800 text-sm">
                                    ${Number(p.montoTotal).toLocaleString()} <span className="text-[9px] text-slate-400">{p.moneda}</span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="flex justify-between items-center text-[10px] font-black text-slate-400 px-4 uppercase">
                <p>Mostrando {pasajeros.length} pasajeros operando actualmente</p>
                <p>Versión 4.3.1 - Evelux Business Intelligence</p>
            </div>
        </div>
    );
}