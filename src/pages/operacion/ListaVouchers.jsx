import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebaseConfig';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { FileText, Search, Printer, ExternalLink, Ticket } from 'lucide-react';

export default function ListaVouchers() {
    const [reservas, setReservas] = useState([]);
    const [busqueda, setBusqueda] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const q = query(collection(db, "reservas"), orderBy("fechaCreacion", "desc"));
        const unsub = onSnapshot(q, (snap) => {
            setReservas(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => unsub();
    }, []);

    const filtradas = reservas.filter(r =>
        r.folio?.toLowerCase().includes(busqueda.toLowerCase()) ||
        r.paxTitular?.toLowerCase().includes(busqueda.toLowerCase()) ||
        r.destinoNombre?.toLowerCase().includes(busqueda.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
                <div>
                    <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter flex items-center gap-3">
                        Vouchers de Servicio <Ticket className="text-blue-600" size={26} />
                    </h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                        Selecciona una reserva para generar su cupón imprimible
                    </p>
                </div>
                <span className="bg-slate-50 border border-slate-100 text-slate-400 font-black text-[10px] px-4 py-2 rounded-xl uppercase">
                    {reservas.length} reservas
                </span>
            </div>

            {/* Buscador */}
            <div className="relative w-full max-w-sm ml-auto">
                <Search className="absolute left-3 top-2.5 text-slate-300" size={16} />
                <input
                    type="text"
                    placeholder="Buscar folio, pasajero o destino..."
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    onChange={e => setBusqueda(e.target.value)}
                />
            </div>

            {/* Tabla de Reservas */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-black text-[10px] uppercase tracking-widest">
                            <th className="p-5">Folio</th>
                            <th className="p-5">Pasajero Titular</th>
                            <th className="p-5">Destino / Hotel</th>
                            <th className="p-5">Fechas</th>
                            <th className="p-5 text-right">Total</th>
                            <th className="p-5 text-center">Voucher</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {filtradas.length === 0 && (
                            <tr>
                                <td colSpan="6" className="p-10 text-center text-slate-300 font-bold uppercase tracking-widest text-xs italic">
                                    No hay reservas registradas
                                </td>
                            </tr>
                        )}
                        {filtradas.map(r => (
                            <tr key={r.id} className="hover:bg-blue-50/30 transition-colors group">
                                <td className="p-5 font-black text-blue-700 text-sm">{r.folio}</td>
                                <td className="p-5">
                                    <div className="font-bold text-slate-700 uppercase text-xs">{r.paxTitular}</div>
                                    <div className="text-[10px] text-slate-400 italic">
                                        {r.paxCantidad || 1} pasajero(s)
                                    </div>
                                </td>
                                <td className="p-5">
                                    <div className="font-bold text-slate-600 uppercase text-xs">{r.hotelNombre || 'Sin asignar'}</div>
                                    <div className="text-[10px] text-blue-500 font-bold uppercase">{r.destinoNombre}</div>
                                </td>
                                <td className="p-5">
                                    <div className="text-xs font-bold text-slate-600">{r.fechaInicio}</div>
                                    <div className="text-[10px] text-slate-400">al {r.fechaFin}</div>
                                </td>
                                <td className="p-5 text-right">
                                    <div className="font-black text-slate-800">${Number(r.montoTotal || 0).toLocaleString()}</div>
                                    <div className="text-[10px] text-slate-400">{r.moneda}</div>
                                </td>
                                <td className="p-5 text-center">
                                    <button
                                        onClick={() => navigate(`/operacion/voucher/${r.id}`)}
                                        className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-blue-100 hover:shadow-xl hover:scale-105"
                                    >
                                        <FileText size={14} /> Ver Voucher
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
