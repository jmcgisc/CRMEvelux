
import { useEffect, useState } from 'react';
import { db } from '../../firebaseConfig';
import { collection, onSnapshot, addDoc, query, orderBy } from 'firebase/firestore';
import { MapPin, Plus, Search, Globe } from 'lucide-react';

export default function Destinos() {
    const [destinos, setDestinos] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [nuevoDestino, setNuevoDestino] = useState({ nombre: '', clave: '', estatus: 'Activo' });

    useEffect(() => {
        const q = query(collection(db, "destinos"), orderBy("nombre", "asc"));
        const unsub = onSnapshot(q, (snap) => {
            setDestinos(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => unsub();
    }, []);

    const guardarDestino = async (e) => {
        e.preventDefault();
        await addDoc(collection(db, "destinos"), { ...nuevoDestino });
        setShowModal(false);
        setNuevoDestino({ nombre: '', clave: '', estatus: 'Activo' });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <h2 className="text-xl font-bold flex items-center gap-2">Destinos <Globe className="text-blue-600" size={20} /></h2>
                <button onClick={() => setShowModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow-lg shadow-blue-100 transition-all">
                    <Plus size={18} /> Agregar Destino
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left text-sm border-collapse">
                    <thead>
                        <tr className="bg-slate-50 border-b border-gray-200 text-slate-500 text-[10px] font-black uppercase tracking-widest">
                            <th className="p-4">ID</th>
                            <th className="p-4">Destino</th>
                            <th className="p-4">Clave</th>
                            <th className="p-4">Estatus</th>
                            <th className="p-4 text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {destinos.map((d, index) => (
                            <tr key={d.id} className="hover:bg-blue-50/30 transition-colors">
                                <td className="p-4 text-gray-400 font-medium">{100 + index}</td>
                                <td className="p-4 font-bold text-slate-700 uppercase">{d.nombre}</td>
                                <td className="p-4 font-medium text-blue-600">{d.clave}</td>
                                <td className="p-4">
                                    <span className="text-emerald-600 font-bold">● {d.estatus}</span>
                                </td>
                                <td className="p-4 text-center">
                                    <button className="text-blue-500 hover:text-blue-700 font-bold text-xs uppercase">Editar</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div className="p-4 bg-slate-50 border-t text-[10px] font-bold text-slate-400">
                    Mostrando {destinos.length} destinos registrados
                </div>
            </div>

            {/* MODAL SIMPLIFICADO */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-white/20">
                        <div className="bg-slate-800 p-4 text-white flex justify-between items-center font-black text-xs uppercase tracking-widest">
                            <span>Nuevo Destino Turístico</span>
                            <button onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        <form onSubmit={guardarDestino} className="p-6 space-y-4">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Nombre del Destino</label>
                                <input required className="w-full border-2 border-slate-100 rounded-xl p-3 text-sm focus:border-blue-500 outline-none transition-all" type="text" onChange={e => setNuevoDestino({ ...nuevoDestino, nombre: e.target.value })} />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Clave (Ej. CAN, RIV)</label>
                                <input required className="w-full border-2 border-slate-100 rounded-xl p-3 text-sm focus:border-blue-500 outline-none transition-all" type="text" onChange={e => setNuevoDestino({ ...nuevoDestino, clave: e.target.value })} />
                            </div>
                            <button type="submit" className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all uppercase tracking-widest text-xs">
                                Guardar en Catálogo
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}