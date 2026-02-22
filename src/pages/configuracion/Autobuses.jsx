import { useEffect, useState } from 'react';
import { db } from '../../firebaseConfig';
import { collection, onSnapshot, addDoc, query, orderBy } from 'firebase/firestore';
import { Bus, Plus, Search, Settings, Edit, Power } from 'lucide-react';

export default function Autobuses() {
    const [autobuses, setAutobuses] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [busqueda, setBusqueda] = useState("");
    const [nuevoBus, setNuevoBus] = useState({
        nombreUnidad: '',
        placas: '',
        capacidad: 45,
        tipo: 'Gran Turismo',
        estatus: 'Activo'
    });

    useEffect(() => {
        const q = query(collection(db, "autobuses"), orderBy("nombreUnidad", "asc"));
        const unsub = onSnapshot(q, (snap) => {
            setAutobuses(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => unsub();
    }, []);

    const guardarBus = async (e) => {
        e.preventDefault();
        try {
            await addDoc(collection(db, "autobuses"), {
                ...nuevoBus,
                fechaAlta: new Date().toISOString().split('T')[0]
            });
            setShowModal(false);
            setNuevoBus({ nombreUnidad: '', placas: '', capacidad: 45, tipo: 'Gran Turismo', estatus: 'Activo' });
        } catch (err) { console.error("Error al guardar unidad:", err); }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div>
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        Flota de Autobuses <Bus className="text-blue-600" size={20} />
                    </h2>
                    <p className="text-xs text-gray-500 font-medium">Gestión de unidades y transporte terrestre</p>
                </div>
                <button onClick={() => setShowModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-bold transition-all shadow-lg shadow-blue-100">
                    <Plus size={18} /> Agregar Unidad
                </button>
            </div>

            <div className="flex justify-end">
                <div className="relative w-80">
                    <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar unidad o placas..."
                        className="pl-10 pr-4 py-2 border rounded-xl w-full text-sm outline-none focus:ring-2 focus:ring-blue-500"
                        onChange={(e) => setBusqueda(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left text-sm border-collapse">
                    <thead>
                        <tr className="bg-slate-50 border-b border-gray-200 text-slate-500 text-[10px] font-black uppercase tracking-widest">
                            <th className="p-4">Unidad</th>
                            <th className="p-4">Placas</th>
                            <th className="p-4 text-center">Capacidad</th>
                            <th className="p-4">Tipo</th>
                            <th className="p-4">Estatus</th>
                            <th className="p-4 text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {autobuses.filter(b => b.nombreUnidad.toLowerCase().includes(busqueda.toLowerCase())).map((b) => (
                            <tr key={b.id} className="hover:bg-blue-50/30 transition-colors">
                                <td className="p-4 font-bold text-slate-700 uppercase">{b.nombreUnidad}</td>
                                <td className="p-4 font-medium text-blue-600">{b.placas || 'N/A'}</td>
                                <td className="p-4 text-center font-black text-slate-800">{b.capacidad} <span className="text-[10px] text-gray-400">pax</span></td>
                                <td className="p-4 italic text-gray-500 text-xs">{b.tipo}</td>
                                <td className="p-4">
                                    <span className="text-emerald-600 font-bold flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span> {b.estatus}
                                    </span>
                                </td>
                                <td className="p-4">
                                    <div className="flex justify-center gap-2">
                                        <button className="p-1.5 text-blue-500 border border-blue-50 rounded hover:bg-blue-50"><Edit size={14} /></button>
                                        <button className="p-1.5 text-slate-400 border border-slate-100 rounded hover:bg-slate-50"><Power size={14} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* MODAL DE REGISTRO */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-white/20">
                        <div className="bg-slate-800 p-4 text-white flex justify-between items-center font-black text-xs uppercase tracking-widest">
                            <span>Nueva Unidad de Transporte</span>
                            <button onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        <form onSubmit={guardarBus} className="p-8 space-y-5">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Nombre de la Unidad / Eco</label>
                                <input required className="w-full border-2 border-slate-100 rounded-xl p-3 text-sm focus:border-blue-500 outline-none transition-all" type="text" placeholder="Ej. BUS-01 Diamante" onChange={e => setNuevoBus({ ...nuevoBus, nombreUnidad: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Placas</label>
                                    <input className="w-full border-2 border-slate-100 rounded-xl p-3 text-sm outline-none" type="text" onChange={e => setNuevoBus({ ...nuevoBus, placas: e.target.value })} />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Capacidad (Asientos)</label>
                                    <input required className="w-full border-2 border-slate-100 rounded-xl p-3 text-sm outline-none" type="number" value={nuevoBus.capacidad} onChange={e => setNuevoBus({ ...nuevoBus, capacidad: e.target.value })} />
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Tipo de Servicio</label>
                                <select className="w-full border-2 border-slate-100 rounded-xl p-3 text-sm outline-none" onChange={e => setNuevoBus({ ...nuevoBus, tipo: e.target.value })}>
                                    <option value="Gran Turismo">Gran Turismo</option>
                                    <option value="Sprinter">Sprinter / Van</option>
                                    <option value="SUV">SUV Ejecutiva</option>
                                </select>
                            </div>
                            <button type="submit" className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all uppercase tracking-widest text-xs mt-4">
                                Registrar en Flota
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}