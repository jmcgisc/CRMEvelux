import { useEffect, useState } from 'react';
import { db } from '../../firebaseConfig';
import { collection, onSnapshot, addDoc, query, orderBy, getDocs, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { Hotel, Plus, Search, MapPin, Star, Edit, Trash2, Globe } from 'lucide-react';

export default function Hoteles() {
    const [hoteles, setHoteles] = useState([]);
    const [destinos, setDestinos] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [busqueda, setBusqueda] = useState("");
    const [editingId, setEditingId] = useState(null);

    const [formData, setFormData] = useState({
        nombre: '',
        destinoId: '',
        nombreDestino: '',
        categoria: '5',
        estatus: 'Activo'
    });

    useEffect(() => {
        // 1. Escuchar Hoteles en tiempo real
        const q = query(collection(db, "hoteles"), orderBy("nombre", "asc"));
        const unsubHoteles = onSnapshot(q, (snap) => {
            setHoteles(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        // 2. Cargar Destinos para el selector
        const cargarDestinos = async () => {
            const snap = await getDocs(collection(db, "destinos"));
            setDestinos(snap.docs.map(d => ({ id: d.id, nombre: d.data().nombre })));
        };

        cargarDestinos();
        return () => unsubHoteles();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const destinoSeleccionado = destinos.find(d => d.id === formData.destinoId);
        const dataFinal = {
            ...formData,
            nombreDestino: destinoSeleccionado?.nombre || 'Sin asignar'
        };

        try {
            if (editingId) {
                await updateDoc(doc(db, "hoteles", editingId), dataFinal);
            } else {
                await addDoc(collection(db, "hoteles"), {
                    ...dataFinal,
                    fechaAlta: new Date().toISOString()
                });
            }
            resetForm();
        } catch (err) { console.error("Error al guardar hotel:", err); }
    };

    const handleEdit = (hotel) => {
        setFormData(hotel);
        setEditingId(hotel.id);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm("¿Deseas eliminar este hotel del catálogo?")) {
            await deleteDoc(doc(db, "hoteles", id));
        }
    };

    const resetForm = () => {
        setFormData({ nombre: '', destinoId: '', nombreDestino: '', categoria: '5', estatus: 'Activo' });
        setEditingId(null);
        setShowModal(false);
    };

    return (
        <div className="space-y-6">
            {/* Header Estratégico */}
            <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
                <div>
                    <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter flex items-center gap-2">
                        Catálogo de Hoteles <Hotel className="text-blue-600" size={24} />
                    </h2>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Administración de propiedades y convenios</p>
                </div>
                <button onClick={() => setShowModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-xl shadow-blue-100 transition-all uppercase text-xs tracking-widest">
                    <Plus size={18} /> Agregar Hotel
                </button>
            </div>

            {/* Buscador */}
            <div className="flex justify-end">
                <div className="relative w-80">
                    <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar hotel o destino..."
                        className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        onChange={(e) => setBusqueda(e.target.value)}
                    />
                </div>
            </div>

            {/* Tabla Estilo Evelux */}
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="bg-slate-50 border-b border-gray-200 text-slate-400 font-black uppercase text-[10px] tracking-widest">
                            <th className="p-5">Hotel / Categoría</th>
                            <th className="p-5">Destino</th>
                            <th className="p-5">Estatus</th>
                            <th className="p-5 text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {hoteles.filter(h => h.nombre.toLowerCase().includes(busqueda.toLowerCase()) || h.nombreDestino.toLowerCase().includes(busqueda.toLowerCase())).map((h) => (
                            <tr key={h.id} className="hover:bg-blue-50/30 transition-colors">
                                <td className="p-5">
                                    <div className="font-black text-slate-700 uppercase">{h.nombre}</div>
                                    <div className="flex text-yellow-400 mt-1">
                                        {[...Array(Number(h.categoria))].map((_, i) => <Star key={i} size={10} fill="currentColor" />)}
                                    </div>
                                </td>
                                <td className="p-5">
                                    <div className="flex items-center gap-1 text-blue-600 font-bold text-xs uppercase">
                                        <MapPin size={12} className="text-red-400" /> {h.nombreDestino}
                                    </div>
                                </td>
                                <td className="p-5">
                                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${h.estatus === 'Activo' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                                        ● {h.estatus}
                                    </span>
                                </td>
                                <td className="p-5">
                                    <div className="flex justify-center gap-2">
                                        <button onClick={() => handleEdit(h)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-all"><Edit size={16} /></button>
                                        <button onClick={() => handleDelete(h.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={16} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* MODAL DE CARGA */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden border border-white/20">
                        <div className="bg-slate-800 p-5 text-white flex justify-between items-center">
                            <h3 className="font-black text-xs uppercase tracking-widest">
                                {editingId ? 'Editar Hotel' : 'Registrar Nueva Propiedad'}
                            </h3>
                            <button onClick={resetForm} className="text-xl">✕</button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-8 space-y-5">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Nombre del Hotel</label>
                                <input required className="w-full border-2 border-slate-100 rounded-xl p-3 text-sm focus:border-blue-500 outline-none uppercase" value={formData.nombre} onChange={e => setFormData({ ...formData, nombre: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Destino</label>
                                    <select required className="w-full border-2 border-slate-100 rounded-xl p-3 text-sm outline-none" value={formData.destinoId} onChange={e => setFormData({ ...formData, destinoId: e.target.value })}>
                                        <option value="">Selecciona...</option>
                                        {destinos.map(d => <option key={d.id} value={d.id}>{d.nombre}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Categoría</label>
                                    <select className="w-full border-2 border-slate-100 rounded-xl p-3 text-sm" value={formData.categoria} onChange={e => setFormData({ ...formData, categoria: e.target.value })}>
                                        <option value="5">5 Estrellas</option>
                                        <option value="4">4 Estrellas</option>
                                        <option value="3">3 Estrellas</option>
                                        <option value="2">2 Estrellas</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Estado Operativo</label>
                                <select className="w-full border-2 border-slate-100 rounded-xl p-3 text-sm" value={formData.estatus} onChange={e => setFormData({ ...formData, estatus: e.target.value })}>
                                    <option value="Activo">Activo</option>
                                    <option value="Inactivo">Inactivo / Fuera de Convenio</option>
                                </select>
                            </div>
                            <button type="submit" className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all uppercase tracking-widest text-xs mt-4">
                                {editingId ? 'Actualizar Hotel' : 'Guardar en Catálogo'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}