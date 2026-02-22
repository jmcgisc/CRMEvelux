import { useEffect, useState } from 'react';
import { db } from '../../firebaseConfig';
import { collection, onSnapshot, addDoc, query, orderBy, doc, deleteDoc, Timestamp } from 'firebase/firestore';
import { Wallet, Plus, ArrowUpCircle, ArrowDownCircle, Search, Trash2, Filter, PieChart, DollarSign } from 'lucide-react';

export default function CajaChica() {
    const [movimientos, setMovimientos] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [balance, setBalance] = useState({ total: 0, ingresos: 0, egresos: 0 });
    const [busqueda, setBusqueda] = useState("");

    const [formData, setFormData] = useState({
        concepto: '',
        monto: '',
        tipo: 'Egreso', // Ingreso o Egreso
        categoria: 'Operativo',
        referencia: '', // Folio de reserva si aplica
        fecha: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        const q = query(collection(db, "caja_chica"), orderBy("fecha", "desc"));
        const unsub = onSnapshot(q, (snap) => {
            const docs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setMovimientos(docs);

            // Calcular Balance General
            const ingresos = docs.filter(d => d.tipo === 'Ingreso').reduce((acc, curr) => acc + Number(curr.monto), 0);
            const egresos = docs.filter(d => d.tipo === 'Egreso').reduce((acc, curr) => acc + Number(curr.monto), 0);
            setBalance({ ingresos, egresos, total: ingresos - egresos });
        });
        return () => unsub();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await addDoc(collection(db, "caja_chica"), {
                ...formData,
                monto: Number(formData.monto),
                creadoPor: "Administración", // Aquí irá el usuario logueado
                timestamp: Timestamp.now()
            });
            resetForm();
        } catch (err) { console.error("Error en caja:", err); }
    };

    const resetForm = () => {
        setFormData({ concepto: '', monto: '', tipo: 'Egreso', categoria: 'Operativo', referencia: '', fecha: new Date().toISOString().split('T')[0] });
        setShowModal(false);
    };

    return (
        <div className="space-y-6">
            {/* Header y Balance General */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter flex items-center gap-2">
                            Caja Chica & Gastos <Wallet className="text-blue-600" size={24} />
                        </h2>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic">Flujo de efectivo operativo Evelux</p>
                    </div>
                    <button onClick={() => setShowModal(true)} className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-xl hover:bg-slate-800 transition-all">
                        <Plus size={16} /> Registrar Movimiento
                    </button>
                </div>

                <div className="bg-blue-600 rounded-[2.5rem] p-8 text-white shadow-xl shadow-blue-100 flex flex-col justify-center">
                    <p className="text-[10px] font-black uppercase opacity-60 tracking-[0.2em]">Balance Total</p>
                    <h3 className="text-3xl font-black tracking-tighter">${balance.total.toLocaleString()}</h3>
                </div>
            </div>

            {/* Resumen de Flujo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 flex items-center gap-4">
                    <div className="bg-emerald-50 text-emerald-500 p-4 rounded-2xl"><ArrowUpCircle size={24} /></div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase">Ingresos Totales</p>
                        <p className="text-xl font-black text-slate-700">${balance.ingresos.toLocaleString()}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 flex items-center gap-4">
                    <div className="bg-red-50 text-red-500 p-4 rounded-2xl"><ArrowDownCircle size={24} /></div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase">Egresos Totales</p>
                        <p className="text-xl font-black text-slate-700">${balance.egresos.toLocaleString()}</p>
                    </div>
                </div>
            </div>

            {/* Tabla de Movimientos */}
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                    <h3 className="font-black text-xs uppercase tracking-widest text-slate-500">Historial de Transacciones</h3>
                    <div className="relative w-64">
                        <Search className="absolute left-3 top-2 text-slate-300" size={14} />
                        <input type="text" placeholder="Buscar concepto..." className="pl-9 pr-4 py-1.5 border border-slate-200 rounded-xl text-xs w-full focus:ring-2 focus:ring-blue-500 outline-none" onChange={(e) => setBusqueda(e.target.value)} />
                    </div>
                </div>
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="text-slate-400 font-black uppercase text-[9px] tracking-[0.2em]">
                            <th className="p-5">Fecha</th>
                            <th className="p-5">Concepto / Categoría</th>
                            <th className="p-5">Referencia</th>
                            <th className="p-5 text-right">Monto</th>
                            <th className="p-5 text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 font-medium">
                        {movimientos.filter(m => m.concepto.toLowerCase().includes(busqueda.toLowerCase())).map((m) => (
                            <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                                <td className="p-5 text-slate-400 text-xs font-bold">{m.fecha}</td>
                                <td className="p-5">
                                    <div className="font-black text-slate-700 uppercase text-xs">{m.concepto}</div>
                                    <div className="text-[9px] text-blue-500 font-bold tracking-widest uppercase">{m.categoria}</div>
                                </td>
                                <td className="p-5">
                                    <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded text-[9px] font-black">
                                        {m.referencia || 'S/R'}
                                    </span>
                                </td>
                                <td className={`p-5 text-right font-black ${m.tipo === 'Ingreso' ? 'text-emerald-500' : 'text-red-500'}`}>
                                    {m.tipo === 'Ingreso' ? '+' : '-'} ${Number(m.monto).toLocaleString()}
                                </td>
                                <td className="p-5 text-center">
                                    <button onClick={async () => { if (window.confirm("¿Eliminar registro?")) await deleteDoc(doc(db, "caja_chica", m.id)); }} className="text-slate-300 hover:text-red-500 transition-colors">
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal de Registro */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 text-slate-800">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="bg-slate-800 p-5 text-white flex justify-between items-center font-black text-[10px] uppercase tracking-[0.2em]">
                            Nuevo Registro Financiero
                            <button onClick={resetForm}>✕</button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-8 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block">Concepto del Gasto/Ingreso</label>
                                    <input required className="w-full border-2 border-slate-100 rounded-xl p-3 text-sm focus:border-blue-500 outline-none font-bold" value={formData.concepto} onChange={e => setFormData({ ...formData, concepto: e.target.value })} />
                                </div>
                                <div>
                                    <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block">Monto ($)</label>
                                    <input required type="number" className="w-full border-2 border-slate-100 rounded-xl p-3 text-sm font-black text-blue-600" value={formData.monto} onChange={e => setFormData({ ...formData, monto: e.target.value })} />
                                </div>
                                <div>
                                    <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block">Tipo</label>
                                    <select className="w-full border-2 border-slate-100 rounded-xl p-3 text-sm font-bold" value={formData.tipo} onChange={e => setFormData({ ...formData, tipo: e.target.value })}>
                                        <option value="Egreso">Salida (Gasto)</option>
                                        <option value="Ingreso">Entrada (Venta/Abono)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block">Categoría</label>
                                    <select className="w-full border-2 border-slate-100 rounded-xl p-3 text-sm font-bold" value={formData.categoria} onChange={e => setFormData({ ...formData, categoria: e.target.value })}>
                                        <option value="Operativo">Operativo</option>
                                        <option value="Marketing">Marketing (Ads)</option>
                                        <option value="Comisión">Comisión Bancaria</option>
                                        <option value="Nómina">Nómina / Honorarios</option>
                                        <option value="Venta">Venta Directa</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block">Folio Ref.</label>
                                    <input className="w-full border-2 border-slate-100 rounded-xl p-3 text-sm" placeholder="Opcional" value={formData.referencia} onChange={e => setFormData({ ...formData, referencia: e.target.value })} />
                                </div>
                            </div>
                            <button type="submit" className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl hover:bg-blue-700 shadow-xl transition-all uppercase tracking-widest text-[10px] mt-4">
                                Confirmar Movimiento
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}