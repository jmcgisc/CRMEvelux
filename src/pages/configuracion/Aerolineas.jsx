import { useEffect, useState } from 'react';
import { db } from '../../firebaseConfig';
import { collection, onSnapshot, addDoc, query, orderBy } from 'firebase/firestore';
import { Plane, Plus, Search, Globe, Edit, Power } from 'lucide-react';

export default function Aerolineas() {
    const [aerolineas, setAerolineas] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [busqueda, setBusqueda] = useState("");
    const [nuevaAero, setNuevaAero] = useState({
        nombre: '',
        claveIATA: '',
        pais: 'México',
        estatus: 'Activo'
    });

    useEffect(() => {
        const q = query(collection(db, "aerolineas"), orderBy("nombre", "asc"));
        const unsub = onSnapshot(q, (snap) => {
            setAerolineas(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => unsub();
    }, []);

    const guardarAerolinea = async (e) => {
        e.preventDefault();
        try {
            await addDoc(collection(db, "aerolineas"), {
                ...nuevaAero,
                fechaAlta: new Date().toISOString().split('T')[0]
            });
            setShowModal(false);
            setNuevaAero({ nombre: '', claveIATA: '', pais: 'México', estatus: 'Activo' });
        } catch (err) { console.error("Error al guardar aerolínea:", err); }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div>
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        Catálogo de Aerolíneas <Plane className="text-blue-600" size={20} />
                    </h2>
                    <p className="text-xs text-gray-500 font-medium">Gestión de convenios y líneas aéreas</p>
                </div>
                <button onClick={() => setShowModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-bold shadow-lg transition-all">
                    <Plus size={18} /> Agregar Aerolínea
                </button>
            </div>

            <div className="flex justify-end">
                <div className="relative w-80">
                    <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar por nombre o IATA..."
                        className="pl-10 pr-4 py-2 border rounded-xl w-full text-sm outline-none focus:ring-2 focus:ring-blue-500"
                        onChange={(e) => setBusqueda(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="bg-slate-50 border-b border-gray-200 text-slate-500 text-[10px] font-black uppercase tracking-widest">
                            <th className="p-4">Aerolínea</th>
                            <th className="p-4 text-center">Clave IATA</th>
                            <th className="p-4">País Origen</th>
                            <th className="p-4">Estatus</th>
                            <th className="p-4 text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {aerolineas.filter(a => a.nombre.toLowerCase().includes(busqueda.toLowerCase()) || a.claveIATA.toLowerCase().includes(busqueda.toLowerCase())).map((a) => (
                            <tr key={a.id} className="hover:bg-blue-50/30 transition-colors">
                                <td className="p-4">
                                    <div className="font-bold text-slate-700 uppercase flex items-center gap-2">
                                        <Plane size={14} className="text-slate-400" /> {a.nombre}
                                    </div>
                                </td>
                                <td className="p-4 text-center font-black text-blue-600 tracking-tighter text-base">{a.claveIATA}</td>
                                <td className="p-4 text-gray-500 font-medium flex items-center gap-2">
                                    <Globe size={14} /> {a.pais}
                                </td>
                                <td className="p-4">
                                    <span className="text-emerald-600 font-bold">● {a.estatus}</span>
                                </td>
                                <td className="p-4">
                                    <div className="flex justify-center gap-2">
                                        <button className="p-1.5 text-blue-500 border border-blue-100 rounded hover:bg-blue-50"><Edit size={14} /></button>
                                        <button className="p-1.5 text-slate-400 border border-slate-100 rounded hover:bg-slate-50"><Power size={14} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="bg-slate-800 p-4 text-white flex justify-between items-center font-black text-xs uppercase tracking-widest">
                            <span>Nueva Aerolínea</span>
                            <button onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        <form onSubmit={guardarAerolinea} className="p-8 space-y-5">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Nombre de la Aerolínea</label>
                                <input required className="w-full border-2 border-slate-100 rounded-xl p-3 text-sm focus:border-blue-500 outline-none uppercase" type="text" placeholder="Ej. Aeroméxico" onChange={e => setNuevaAero({ ...nuevaAero, nombre: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Clave IATA (2-3 letras)</label>
                                    <input required className="w-full border-2 border-slate-100 rounded-xl p-3 text-sm outline-none uppercase" maxLength="3" type="text" placeholder="Ej. AM" onChange={e => setNuevaAero({ ...nuevaAero, claveIATA: e.target.value })} />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">País</label>
                                    <input className="w-full border-2 border-slate-100 rounded-xl p-3 text-sm outline-none" type="text" value={nuevaAero.pais} onChange={e => setNuevaAero({ ...nuevaAero, pais: e.target.value })} />
                                </div>
                            </div>
                            <button type="submit" className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all uppercase tracking-widest text-xs mt-4">
                                Confirmar Alta
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}