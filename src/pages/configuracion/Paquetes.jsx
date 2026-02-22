import { useEffect, useState } from 'react';
import { db } from '../../firebaseConfig';
import { collection, onSnapshot, addDoc, query, orderBy, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { Package, Plus, Search, Tag, MapPin, Calendar, Edit, Trash2, DollarSign } from 'lucide-react';

export default function Paquetes() {
    const [paquetes, setPaquetes] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [busqueda, setBusqueda] = useState("");
    const [editingId, setEditingId] = useState(null);

    const [formData, setFormData] = useState({
        nombrePaquete: '',
        destino: '',
        duracion: '',
        precioBase: 0,
        incluye: '',
        estatus: 'Activo'
    });

    useEffect(() => {
        const q = query(collection(db, "paquetes"), orderBy("nombrePaquete", "asc"));
        const unsub = onSnapshot(q, (snap) => {
            setPaquetes(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => unsub();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await updateDoc(doc(db, "paquetes", editingId), formData);
            } else {
                await addDoc(collection(db, "paquetes"), {
                    ...formData,
                    fechaCreacion: new Date().toISOString()
                });
            }
            resetForm();
        } catch (err) { console.error("Error al gestionar paquete:", err); }
    };

    const handleEdit = (p) => {
        setFormData(p);
        setEditingId(p.id);
        setShowModal(true);
    };

    const resetForm = () => {
        setFormData({ nombrePaquete: '', destino: '', duracion: '', precioBase: 0, incluye: '', estatus: 'Activo' });
        setEditingId(null);
        setShowModal(false);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
                <div>
                    <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter flex items-center gap-2">
                        Configuración de Paquetes <Package className="text-blue-600" size={24} />
                    </h2>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Creación de ofertas comerciales y tours</p>
                </div>
                <button onClick={() => setShowModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-xl transition-all uppercase text-xs">
                    <Plus size={18} /> Nuevo Paquete
                </button>
            </div>

            <div className="flex justify-end">
                <div className="relative w-80">
                    <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar por nombre o destino..."
                        className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                        onChange={(e) => setBusqueda(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paquetes.filter(p => p.nombrePaquete.toLowerCase().includes(busqueda.toLowerCase())).map((p) => (
                    <div key={p.id} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 hover:shadow-md transition-all group relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                            <button onClick={() => handleEdit(p)} className="bg-blue-50 text-blue-600 p-2 rounded-lg hover:bg-blue-600 hover:text-white transition-colors"><Edit size={14} /></button>
                            <button onClick={async () => { if (window.confirm("¿Borrar paquete?")) await deleteDoc(doc(db, "paquetes", p.id)); }} className="bg-red-50 text-red-600 p-2 rounded-lg hover:bg-red-600 hover:text-white transition-colors"><Trash2 size={14} /></button>
                        </div>

                        <div className="flex items-center gap-2 text-blue-600 mb-4">
                            <Tag size={16} />
                            <span className="text-[10px] font-black uppercase tracking-widest">{p.estatus}</span>
                        </div>

                        <h3 className="text-lg font-black text-slate-800 uppercase leading-tight mb-2">{p.nombrePaquete}</h3>

                        <div className="space-y-2 mb-6">
                            <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase">
                                <MapPin size={14} className="text-red-400" /> {p.destino}
                            </div>
                            <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase">
                                <Calendar size={14} className="text-blue-400" /> {p.duracion}
                            </div>
                        </div>

                        <div className="bg-slate-50 p-4 rounded-2xl mb-4">
                            <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Incluye:</p>
                            <p className="text-[11px] text-slate-600 line-clamp-2 italic">{p.incluye}</p>
                        </div>

                        <div className="flex justify-between items-end">
                            <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase">Desde:</p>
                                <p className="text-xl font-black text-slate-800">${Number(p.precioBase).toLocaleString()} <span className="text-[10px] text-slate-400">MXN</span></p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* MODAL DE REGISTRO */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 text-slate-700">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden">
                        <div className="bg-slate-800 p-5 text-white flex justify-between items-center">
                            <h3 className="font-black text-xs uppercase tracking-widest">
                                {editingId ? 'Editar Paquete' : 'Crear Paquete Comercial'}
                            </h3>
                            <button onClick={resetForm}>✕</button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-8 space-y-4 text-slate-700">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Nombre del Paquete</label>
                                <input required className="w-full border-2 border-slate-50 rounded-xl p-3 text-sm focus:border-blue-500 outline-none uppercase" value={formData.nombrePaquete} onChange={e => setFormData({ ...formData, nombrePaquete: e.target.value })} placeholder="Ej. CANCUN TODO INCLUIDO" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Destino</label>
                                    <input required className="w-full border-2 border-slate-50 rounded-xl p-3 text-sm" value={formData.destino} onChange={e => setFormData({ ...formData, destino: e.target.value })} />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Duración</label>
                                    <input required className="w-full border-2 border-slate-50 rounded-xl p-3 text-sm" placeholder="4 Días / 3 Noches" value={formData.duracion} onChange={e => setFormData({ ...formData, duracion: e.target.value })} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Precio Base ($)</label>
                                    <input required type="number" className="w-full border-2 border-slate-50 rounded-xl p-3 text-sm font-bold text-blue-600" value={formData.precioBase} onChange={e => setFormData({ ...formData, precioBase: e.target.value })} />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Estatus</label>
                                    <select className="w-full border-2 border-slate-50 rounded-xl p-3 text-sm" value={formData.estatus} onChange={e => setFormData({ ...formData, estatus: e.target.value })}>
                                        <option value="Activo">Activo</option>
                                        <option value="Inactivo">Inactivo / Pausado</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Descripción breve (Incluye)</label>
                                <textarea rows="3" className="w-full border-2 border-slate-50 rounded-xl p-3 text-sm" value={formData.incluye} onChange={e => setFormData({ ...formData, incluye: e.target.value })} placeholder="Vuelos, Hotel, Desayunos, etc." />
                            </div>
                            <button type="submit" className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl hover:bg-blue-700 shadow-xl transition-all uppercase tracking-widest text-xs mt-4">
                                {editingId ? 'Actualizar Paquete' : 'Guardar en Catálogo'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}