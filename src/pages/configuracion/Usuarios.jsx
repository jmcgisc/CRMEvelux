import { useEffect, useState } from 'react';
import { db } from '../../firebaseConfig';
import { collection, onSnapshot, addDoc, query, orderBy, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { UserPlus, Search, ShieldCheck, Edit, Trash2, Target, Key, EyeOff } from 'lucide-react';

export default function Usuarios() {
    const [usuarios, setUsuarios] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [busqueda, setBusqueda] = useState("");
    const [editingId, setEditingId] = useState(null);

    const [formData, setFormData] = useState({
        nombre: '',
        correo: '',
        puesto: 'Ventas',
        rol: 'Ventas',
        meta: 10000,
        estatus: 'Activo',
        permisos: {
            verCostosNetos: false,
            accesoConfiguracion: false,
            exportarExcel: true
        }
    });

    useEffect(() => {
        // Mantenemos la colección "empleados" que ya tenías en uso
        const q = query(collection(db, "empleados"), orderBy("nombre", "asc"));
        const unsub = onSnapshot(q, (snap) => {
            setUsuarios(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => unsub();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await updateDoc(doc(db, "empleados", editingId), formData);
            } else {
                await addDoc(collection(db, "empleados"), {
                    ...formData,
                    fechaAlta: new Date().toISOString().split('T')[0]
                });
            }
            resetForm();
        } catch (err) { console.error("Error:", err); }
    };

    const handleEdit = (user) => {
        setFormData({
            ...user,
            // Aseguramos que existan los permisos si el usuario es antiguo
            permisos: user.permisos || { verCostosNetos: false, accesoConfiguracion: false, exportarExcel: true }
        });
        setEditingId(user.id);
        setShowModal(true);
    };

    const resetForm = () => {
        setFormData({
            nombre: '', correo: '', puesto: 'Ventas', rol: 'Ventas', meta: 10000, estatus: 'Activo',
            permisos: { verCostosNetos: false, accesoConfiguracion: false, exportarExcel: true }
        });
        setEditingId(null);
        setShowModal(false);
    };

    return (
        <div className="space-y-6 text-slate-800">
            {/* Header con estilo Stratik */}
            <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
                <div>
                    <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter flex items-center gap-2">
                        Control de Colaboradores <ShieldCheck className="text-blue-600" size={24} />
                    </h2>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest italic">
                        Gestión de metas y privilegios de acceso
                    </p>
                </div>
                <button onClick={() => setShowModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2 shadow-xl transition-all uppercase text-[10px] tracking-widest">
                    <UserPlus size={18} /> Nuevo Acceso
                </button>
            </div>

            <div className="flex justify-end">
                <div className="relative w-80">
                    <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                    <input type="text" placeholder="Buscar colaborador..." className="pl-10 pr-4 py-2 border-2 border-slate-100 rounded-xl w-full text-sm outline-none focus:border-blue-500 transition-all" onChange={(e) => setBusqueda(e.target.value)} />
                </div>
            </div>

            {/* Tabla Integrada */}
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left text-sm border-collapse">
                    <thead>
                        <tr className="bg-slate-50 border-b border-gray-200 text-slate-400 font-black uppercase text-[10px] tracking-widest">
                            <th className="p-5">Colaborador / Email</th>
                            <th className="p-5">Puesto & Rol</th>
                            <th className="p-5 text-center">Meta Mensual</th>
                            <th className="p-5 text-center">Privilegios</th>
                            <th className="p-5">Estatus</th>
                            <th className="p-5 text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {usuarios.filter(u => u.nombre.toLowerCase().includes(busqueda.toLowerCase())).map((u) => (
                            <tr key={u.id} className="hover:bg-blue-50/30 transition-colors group font-medium text-slate-700">
                                <td className="p-5">
                                    <div className="font-black uppercase text-xs">{u.nombre}</div>
                                    <div className="text-[10px] text-blue-500 font-bold italic">{u.correo}</div>
                                </td>
                                <td className="p-5">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[11px] font-bold text-slate-500 uppercase">{u.puesto}</span>
                                        <span className="bg-blue-100 text-blue-700 w-fit px-2 py-0.5 rounded text-[8px] font-black uppercase">
                                            {u.rol}
                                        </span>
                                    </div>
                                </td>
                                <td className="p-5 text-center font-black text-slate-800">
                                    <div className="flex items-center justify-center gap-1">
                                        <Target size={14} className="text-blue-300" />
                                        ${Number(u.meta).toLocaleString()}
                                    </div>
                                </td>
                                <td className="p-5">
                                    <div className="flex justify-center gap-1">
                                        {u.permisos?.verCostosNetos ? <Key size={14} className="text-red-500" title="Ve costos netos" /> : <EyeOff size={14} className="text-slate-200" />}
                                        {u.permisos?.accesoConfiguracion && <ShieldCheck size={14} className="text-emerald-500" title="Configura sistema" />}
                                    </div>
                                </td>
                                <td className="p-5">
                                    <span className={`font-black text-[10px] flex items-center gap-1 ${u.estatus === 'Activo' ? 'text-emerald-600' : 'text-red-500'}`}>
                                        ● {u.estatus}
                                    </span>
                                </td>
                                <td className="p-5 text-center">
                                    <div className="flex justify-center gap-2">
                                        <button onClick={() => handleEdit(u)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"><Edit size={16} /></button>
                                        <button onClick={async () => { if (window.confirm("¿Eliminar acceso?")) await deleteDoc(doc(db, "empleados", u.id)); }} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={16} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal de Configuración Profunda */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden border border-white/20">
                        <div className="bg-slate-800 p-5 text-white flex justify-between items-center">
                            <h3 className="font-black text-xs uppercase tracking-widest">
                                {editingId ? 'Actualizar Privilegios' : 'Alta de Colaborador Evelux'}
                            </h3>
                            <button onClick={resetForm} className="text-xl">✕</button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-8 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block">Nombre del Empleado</label>
                                    <input required className="w-full border-2 border-slate-100 rounded-xl p-3 text-sm focus:border-blue-500 outline-none" value={formData.nombre} onChange={e => setFormData({ ...formData, nombre: e.target.value })} />
                                </div>
                                <div className="col-span-2">
                                    <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block">Correo de Acceso</label>
                                    <input required className="w-full border-2 border-slate-100 rounded-xl p-3 text-sm" type="email" value={formData.correo} onChange={e => setFormData({ ...formData, correo: e.target.value })} />
                                </div>
                                <div>
                                    <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block">Rol de Sistema</label>
                                    <select className="w-full border-2 border-slate-100 rounded-xl p-3 text-sm font-bold" value={formData.rol} onChange={e => setFormData({ ...formData, rol: e.target.value })}>
                                        <option value="Ventas">Ventas</option>
                                        <option value="Admin">Administración</option>
                                        <option value="Gerencia">Gerencia</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block">Meta Mensual ($)</label>
                                    <input className="w-full border-2 border-slate-100 rounded-xl p-3 text-sm font-black text-blue-600" type="number" value={formData.meta} onChange={e => setFormData({ ...formData, meta: e.target.value })} />
                                </div>
                            </div>

                            <div className="bg-slate-50 p-4 rounded-2xl space-y-3 border border-slate-100">
                                <p className="text-[9px] font-black text-slate-500 uppercase border-b pb-2 mb-2">Permisos de Seguridad (CEO Stratik Only)</p>
                                <label className="flex items-center gap-3 text-xs font-bold text-slate-600 cursor-pointer">
                                    <input type="checkbox" className="w-4 h-4 rounded text-blue-600" checked={formData.permisos.verCostosNetos} onChange={e => setFormData({ ...formData, permisos: { ...formData.permisos, verCostosNetos: e.target.checked } })} />
                                    Visualizar Costos Netos (Bloqueos/Proveedores)
                                </label>
                                <label className="flex items-center gap-3 text-xs font-bold text-slate-600 cursor-pointer">
                                    <input type="checkbox" className="w-4 h-4 rounded text-blue-600" checked={formData.permisos.accesoConfiguracion} onChange={e => setFormData({ ...formData, permisos: { ...formData.permisos, accesoConfiguracion: e.target.checked } })} />
                                    Acceso a Configuración de Hoteles/Paquetes
                                </label>
                            </div>

                            <button type="submit" className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl hover:bg-blue-700 shadow-xl transition-all uppercase tracking-widest text-[10px] mt-4">
                                {editingId ? 'Guardar Cambios' : 'Confirmar y Dar de Alta'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}