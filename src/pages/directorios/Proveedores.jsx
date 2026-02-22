import { useEffect, useState } from 'react';
import { db } from '../../firebaseConfig';
import { collection, onSnapshot, addDoc, query, orderBy, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Plus, Search, Truck, Edit, Power, Trash2, Percent, Mail, Phone } from 'lucide-react';

export default function Proveedores() {
    const [proveedores, setProveedores] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [busqueda, setBusqueda] = useState("");
    const [editingId, setEditingId] = useState(null);

    const [formData, setFormData] = useState({
        nombre: '',
        razonSocial: '',
        contacto: '',
        telefono: '',
        correo: '',
        tipo: 'Ventas', // Ventas, Operador, Ventas/Operador
        comision: 0,
        estatus: 'Activo'
    });

    useEffect(() => {
        const q = query(collection(db, "proveedores"), orderBy("nombre", "asc"));
        const unsub = onSnapshot(q, (snap) => {
            setProveedores(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => unsub();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await updateDoc(doc(db, "proveedores", editingId), formData);
            } else {
                await addDoc(collection(db, "proveedores"), {
                    ...formData,
                    fechaAlta: new Date().toISOString().split('T')[0]
                });
            }
            resetForm();
        } catch (err) { console.error("Error:", err); }
    };

    const resetForm = () => {
        setFormData({ nombre: '', razonSocial: '', contacto: '', telefono: '', correo: '', tipo: 'Ventas', comision: 0, estatus: 'Activo' });
        setEditingId(null);
        setShowModal(false);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div>
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        Directorio de Proveedores <Truck className="text-blue-600" size={20} />
                    </h2>
                    <p className="text-xs text-gray-500 font-medium italic">Gestión de convenios y comisiones operativas</p>
                </div>
                <button onClick={() => setShowModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-bold shadow-lg transition-all">
                    <Plus size={18} /> Nuevo Proveedor
                </button>
            </div>

            <div className="flex justify-end">
                <div className="relative w-80">
                    <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                    <input type="text" placeholder="Buscar por nombre o razón..." className="pl-10 pr-4 py-2 border rounded-xl w-full text-sm focus:ring-2 focus:ring-blue-500 outline-none" onChange={(e) => setBusqueda(e.target.value)} />
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left text-sm border-collapse">
                    <thead>
                        <tr className="bg-slate-50 border-b border-gray-200 text-slate-500 text-[10px] font-black uppercase tracking-widest">
                            <th className="p-4">ID PROV</th>
                            <th className="p-4">Nombre / Razón Social</th>
                            <th className="p-4">Contacto</th>
                            <th className="p-4">Tipo</th>
                            <th className="p-4 text-center">% Comis.</th>
                            <th className="p-4">Estatus</th>
                            <th className="p-4 text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {proveedores.filter(p => p.nombre.toLowerCase().includes(busqueda.toLowerCase())).map((p, idx) => (
                            <tr key={p.id} className="hover:bg-blue-50/30 transition-colors group">
                                <td className="p-4 text-gray-400 font-medium">{idx + 1}</td>
                                <td className="p-4">
                                    <div className="font-bold text-slate-700 uppercase">{p.nombre}</div>
                                    <div className="text-[10px] text-slate-400 italic">{p.razonSocial || 'N/A'}</div>
                                </td>
                                <td className="p-4">
                                    <div className="text-xs font-bold text-slate-600">{p.contacto}</div>
                                    <div className="flex items-center gap-2 text-[10px] text-blue-500">
                                        <Mail size={10} /> {p.correo}
                                    </div>
                                </td>
                                <td className="p-4">
                                    <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-[9px] font-black uppercase tracking-tighter">
                                        {p.tipo}
                                    </span>
                                </td>
                                <td className="p-4 text-center font-black text-blue-700">
                                    <div className="flex items-center justify-center gap-0.5 text-base">
                                        {p.comision}<Percent size={12} />
                                    </div>
                                </td>
                                <td className="p-4">
                                    <span className={`font-bold text-xs ${p.estatus === 'Activo' ? 'text-emerald-600' : 'text-red-500'}`}>
                                        ● {p.estatus}
                                    </span>
                                </td>
                                <td className="p-4">
                                    <div className="flex justify-center gap-2">
                                        <button onClick={() => { setFormData(p); setEditingId(p.id); setShowModal(true); }} className="p-1.5 text-blue-500 border border-blue-50 rounded hover:bg-blue-50"><Edit size={14} /></button>
                                        <button onClick={async () => { if (window.confirm("¿Eliminar proveedor?")) await deleteDoc(doc(db, "proveedores", p.id)); }} className="p-1.5 text-red-500 border border-red-50 rounded hover:bg-red-50"><Trash2 size={14} /></button>
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
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden border border-white/20">
                        <div className="bg-slate-800 p-5 text-white flex justify-between items-center">
                            <h3 className="font-black text-xs uppercase tracking-widest">
                                {editingId ? 'Editar Proveedor' : 'Nuevo Proveedor Operativo'}
                            </h3>
                            <button onClick={resetForm} className="hover:rotate-90 transition-transform">✕</button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-10 grid grid-cols-2 gap-6">
                            <div className="col-span-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Nombre Comercial</label>
                                <input required className="w-full border-2 border-slate-50 rounded-xl p-3 text-sm outline-none focus:border-blue-500" value={formData.nombre} onChange={e => setFormData({ ...formData, nombre: e.target.value })} />
                            </div>
                            <div className="col-span-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Razón Social (Opcional)</label>
                                <input className="w-full border-2 border-slate-50 rounded-xl p-3 text-sm outline-none focus:border-blue-500" value={formData.razonSocial} onChange={e => setFormData({ ...formData, razonSocial: e.target.value })} />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Contacto / Propietario</label>
                                <input required className="w-full border-2 border-slate-50 rounded-xl p-3 text-sm" value={formData.contacto} onChange={e => setFormData({ ...formData, contacto: e.target.value })} />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Correo Electrónico</label>
                                <input required type="email" className="w-full border-2 border-slate-50 rounded-xl p-3 text-sm" value={formData.correo} onChange={e => setFormData({ ...formData, correo: e.target.value })} />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Tipo de Proveedor</label>
                                <select className="w-full border-2 border-slate-50 rounded-xl p-3 text-sm outline-none" value={formData.tipo} onChange={e => setFormData({ ...formData, tipo: e.target.value })}>
                                    <option value="Ventas">Ventas</option>
                                    <option value="Operador">Operador</option>
                                    <option value="Ventas / Operador">Ventas / Operador</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">% Comisión Pactada</label>
                                <div className="relative">
                                    <Percent className="absolute right-3 top-3.5 text-slate-300" size={16} />
                                    <input required type="number" step="0.01" className="w-full border-2 border-slate-50 rounded-xl p-3 text-sm font-bold text-blue-600" value={formData.comision} onChange={e => setFormData({ ...formData, comision: e.target.value })} />
                                </div>
                            </div>
                            <button type="submit" className="col-span-2 bg-blue-600 text-white font-black py-4 rounded-2xl hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all uppercase tracking-widest text-xs mt-4">
                                {editingId ? 'Actualizar Información' : 'Guardar en Directorio'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}