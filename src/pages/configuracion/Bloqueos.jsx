import { useEffect, useState } from 'react';
import { db } from '../../firebaseConfig';
import { collection, onSnapshot, addDoc, query, orderBy, doc, deleteDoc, updateDoc, getDocs } from 'firebase/firestore';
import { LayoutGrid, Plus, Search, Hotel, Calendar, Hash, Trash2, Edit, AlertCircle } from 'lucide-react';

export default function Bloqueos() {
    const [bloqueos, setBloqueos] = useState([]);
    const [hoteles, setHoteles] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [busqueda, setBusqueda] = useState("");
    const [editingId, setEditingId] = useState(null);

    const [formData, setFormData] = useState({
        hotelId: '',
        nombreHotel: '',
        fechaInicio: '',
        fechaFin: '',
        cantidadTotal: 0,
        disponibles: 0,
        costoUnitario: 0,
        estatus: 'Activo'
    });

    useEffect(() => {
        // Cargar Bloqueos
        const q = query(collection(db, "bloqueos"), orderBy("fechaInicio", "asc"));
        const unsubBloqueos = onSnapshot(q, (snap) => {
            setBloqueos(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        // Cargar Hoteles para el selector
        const cargarHoteles = async () => {
            const snap = await getDocs(collection(db, "hoteles"));
            setHoteles(snap.docs.map(d => ({ id: d.id, nombre: d.data().nombre })));
        };

        cargarHoteles();
        return () => unsubBloqueos();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const hotelSel = hoteles.find(h => h.id === formData.hotelId);
        const dataFinal = {
            ...formData,
            nombreHotel: hotelSel?.nombre || 'N/A',
            disponibles: editingId ? formData.disponibles : formData.cantidadTotal // Si es nuevo, disponibles = total
        };

        try {
            if (editingId) {
                await updateDoc(doc(db, "bloqueos", editingId), dataFinal);
            } else {
                await addDoc(collection(db, "bloqueos"), {
                    ...dataFinal,
                    fechaAlta: new Date().toISOString()
                });
            }
            resetForm();
        } catch (err) { console.error("Error al guardar bloqueo:", err); }
    };

    const resetForm = () => {
        setFormData({ hotelId: '', nombreHotel: '', fechaInicio: '', fechaFin: '', cantidadTotal: 0, disponibles: 0, costoUnitario: 0, estatus: 'Activo' });
        setEditingId(null);
        setShowModal(false);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
                <div>
                    <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter flex items-center gap-2">
                        Gestión de Bloqueos <LayoutGrid className="text-blue-600" size={24} />
                    </h2>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest text-blue-500">Control de inventario de habitaciones</p>
                </div>
                <button onClick={() => setShowModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2 shadow-xl shadow-blue-100 transition-all uppercase text-xs">
                    <Plus size={18} /> Cargar Nuevo Bloqueo
                </button>
            </div>

            {/* Tabla de Inventario */}
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="bg-slate-50 border-b border-gray-200 text-slate-400 font-black uppercase text-[10px] tracking-widest">
                            <th className="p-5">Hotel / Referencia</th>
                            <th className="p-5">Vigencia</th>
                            <th className="p-5 text-center">Total</th>
                            <th className="p-5 text-center">Disponibles</th>
                            <th className="p-5 text-right">Costo Neto</th>
                            <th className="p-5 text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {bloqueos.map((b) => (
                            <tr key={b.id} className="hover:bg-blue-50/30 transition-colors">
                                <td className="p-5">
                                    <div className="font-black text-slate-700 uppercase flex items-center gap-2">
                                        <Hotel size={14} className="text-blue-500" /> {b.nombreHotel}
                                    </div>
                                    <div className="text-[9px] text-slate-400 italic">ID: {b.id.slice(0, 8)}</div>
                                </td>
                                <td className="p-5">
                                    <div className="flex items-center gap-1 text-slate-600 font-bold text-xs">
                                        <Calendar size={12} className="text-red-400" /> {b.fechaInicio} al {b.fechaFin}
                                    </div>
                                </td>
                                <td className="p-5 text-center font-bold text-slate-400">{b.cantidadTotal}</td>
                                <td className="p-5 text-center">
                                    <span className={`font-black text-lg ${b.disponibles < 5 ? 'text-red-500' : 'text-emerald-600'}`}>
                                        {b.disponibles}
                                    </span>
                                </td>
                                <td className="p-5 text-right font-black text-slate-800">
                                    ${Number(b.costoUnitario).toLocaleString()} <span className="text-[9px] text-slate-400">NETO</span>
                                </td>
                                <td className="p-5">
                                    <div className="flex justify-center gap-2">
                                        <button onClick={() => { setFormData(b); setEditingId(b.id); setShowModal(true); }} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"><Edit size={16} /></button>
                                        <button onClick={async () => { if (window.confirm("¿Eliminar este inventario?")) await deleteDoc(doc(db, "bloqueos", b.id)); }} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
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
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden border border-white/20">
                        <div className="bg-slate-800 p-5 text-white flex justify-between items-center font-black text-xs uppercase tracking-widest">
                            {editingId ? 'Editar Bloqueo' : 'Cargar Inventario Masivo'}
                            <button onClick={resetForm} className="text-xl">✕</button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-10 grid grid-cols-2 gap-6">
                            <div className="col-span-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Seleccionar Hotel</label>
                                <select required className="w-full border-2 border-slate-100 rounded-xl p-3 text-sm outline-none focus:border-blue-500" value={formData.hotelId} onChange={e => setFormData({ ...formData, hotelId: e.target.value })}>
                                    <option value="">--- Buscar Hotel ---</option>
                                    {hoteles.map(h => <option key={h.id} value={h.id}>{h.nombre}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Check-In</label>
                                <input required type="date" className="w-full border-2 border-slate-100 rounded-xl p-3 text-sm" value={formData.fechaInicio} onChange={e => setFormData({ ...formData, fechaInicio: e.target.value })} />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Check-Out</label>
                                <input required type="date" className="w-full border-2 border-slate-100 rounded-xl p-3 text-sm" value={formData.fechaFin} onChange={e => setFormData({ ...formData, fechaFin: e.target.value })} />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Cantidad Total</label>
                                <input required type="number" className="w-full border-2 border-slate-100 rounded-xl p-3 text-sm font-black text-blue-600" value={formData.cantidadTotal} onChange={e => setFormData({ ...formData, cantidadTotal: e.target.value })} />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Costo Neto x Hab.</label>
                                <input required type="number" className="w-full border-2 border-slate-100 rounded-xl p-3 text-sm" value={formData.costoUnitario} onChange={e => setFormData({ ...formData, costoUnitario: e.target.value })} />
                            </div>
                            <button type="submit" className="col-span-2 bg-blue-600 text-white font-black py-4 rounded-2xl hover:bg-blue-700 shadow-xl transition-all uppercase tracking-widest text-xs mt-4">
                                {editingId ? 'Actualizar Inventario' : 'Guardar y Bloquear'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}