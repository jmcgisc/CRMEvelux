import { useEffect, useState } from 'react';
import { db } from '../firebaseConfig';
import { collection, onSnapshot, addDoc, query, orderBy } from 'firebase/firestore';
import { UserPlus, Search, Globe, Monitor, Users } from 'lucide-react';

export default function Clientes() {
    const [clientesCRM, setClientesCRM] = useState([]);
    const [clientesWeb, setClientesWeb] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [busqueda, setBusqueda] = useState('');
    const [filtroOrigen, setFiltroOrigen] = useState('todos'); // 'todos' | 'web' | 'crm'
    const [nuevoCliente, setNuevoCliente] = useState({
        nombre: '', correo: '', celular: '', ciudad: '', perfil: 'Frecuente'
    });

    // ── 1. Escuchar colección "clientes" (altas manuales desde el CRM) ──────────
    useEffect(() => {
        const q = query(collection(db, 'clientes'), orderBy('fechaAlta', 'desc'));
        const unsub = onSnapshot(q, (snap) => {
            setClientesCRM(snap.docs.map(doc => ({
                id: doc.id,
                _origen: 'crm',
                ...doc.data()
            })));
        });
        return () => unsub();
    }, []);

    // ── 2. Escuchar colección "users" (registros desde la página web) ───────────
    useEffect(() => {
        const unsub = onSnapshot(collection(db, 'users'), (snap) => {
            setClientesWeb(snap.docs.map(doc => ({
                id: doc.id,
                _origen: 'web',
                // Normalizar campos al mismo esquema que "clientes"
                nombre: doc.data().nombre || doc.data().displayName || doc.data().name || '—',
                correo: doc.data().correo || doc.data().email || '—',
                celular: doc.data().celular || doc.data().telefono || doc.data().phone || '',
                ciudad: doc.data().ciudad || doc.data().city || '',
                foto: doc.data().foto || doc.data().photoURL || null,
                fechaAlta: doc.data().fechaAlta || doc.data().createdAt || null,
                ...doc.data()
            })));
        });
        return () => unsub();
    }, []);

    // ── 3. Combinar y filtrar ───────────────────────────────────────────────────
    const todosLosClientes = [
        ...(filtroOrigen === 'web' ? [] : clientesCRM),
        ...(filtroOrigen === 'crm' ? [] : clientesWeb),
    ].filter(c =>
        c.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
        c.correo?.toLowerCase().includes(busqueda.toLowerCase()) ||
        c.ciudad?.toLowerCase().includes(busqueda.toLowerCase())
    );

    // ── 4. Alta manual desde CRM ───────────────────────────────────────────────
    const guardarCliente = async (e) => {
        e.preventDefault();
        try {
            await addDoc(collection(db, 'clientes'), {
                ...nuevoCliente,
                fechaAlta: new Date().toISOString().split('T')[0],
                estatus: 'Activo'
            });
            setShowModal(false);
            setNuevoCliente({ nombre: '', correo: '', celular: '', ciudad: '', perfil: 'Frecuente' });
        } catch (err) { console.error(err); }
    };

    const formatFecha = (fecha) => {
        if (!fecha) return '—';
        if (fecha?.toDate) return fecha.toDate().toLocaleDateString('es-MX');
        if (typeof fecha === 'string') return fecha;
        return '—';
    };

    return (
        <div className="space-y-6">

            {/* ── Header ────────────────────────────────────────────────────────── */}
            <div className="flex flex-wrap justify-between items-start gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div>
                    <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                        Directorio de Clientes <Users className="text-blue-600" size={24} />
                    </h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                        CRM manual · Registros web en tiempo real
                    </p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-blue-200 font-bold text-sm"
                >
                    <UserPlus size={18} /> Agregar Cliente
                </button>
            </div>

            {/* ── Filtros ───────────────────────────────────────────────────────── */}
            <div className="flex flex-wrap items-center gap-3">
                {/* Buscador */}
                <div className="relative flex-1 min-w-[220px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                        type="text"
                        placeholder="Buscar por nombre, correo o ciudad..."
                        value={busqueda}
                        onChange={e => setBusqueda(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 border-2 border-slate-100 rounded-xl text-sm outline-none focus:border-blue-500 transition-all"
                    />
                </div>

                {/* Filtro origen */}
                <div className="flex gap-2">
                    {[
                        { key: 'todos', label: `Todos (${clientesCRM.length + clientesWeb.length})` },
                        { key: 'web', label: `Web (${clientesWeb.length})`, icon: <Globe size={13} /> },
                        { key: 'crm', label: `CRM (${clientesCRM.length})`, icon: <Monitor size={13} /> },
                    ].map(({ key, label, icon }) => (
                        <button
                            key={key}
                            onClick={() => setFiltroOrigen(key)}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wide transition-all border-2 ${filtroOrigen === key
                                    ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                                    : 'bg-white text-slate-500 border-slate-100 hover:border-blue-200'
                                }`}
                        >
                            {icon} {label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Tabla ─────────────────────────────────────────────────────────── */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-gray-100">
                        <tr>
                            <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Cliente</th>
                            <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Contacto</th>
                            <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Ciudad</th>
                            <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Origen</th>
                            <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Alta</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {todosLosClientes.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="p-12 text-center text-slate-300 text-sm font-semibold">
                                    No se encontraron clientes con ese criterio.
                                </td>
                            </tr>
                        ) : (
                            todosLosClientes.map(c => (
                                <tr key={`${c._origen}-${c.id}`} className="hover:bg-blue-50/30 transition-colors group">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            {/* Avatar */}
                                            {c.foto ? (
                                                <img
                                                    src={c.foto}
                                                    alt={c.nombre}
                                                    className="w-9 h-9 rounded-full object-cover border-2 border-white shadow"
                                                />
                                            ) : (
                                                <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-black text-sm">
                                                    {(c.nombre || '?')[0].toUpperCase()}
                                                </div>
                                            )}
                                            <div>
                                                <p className="font-black text-slate-800 text-sm">{c.nombre}</p>
                                                {c.perfil && (
                                                    <span className="text-[9px] bg-slate-100 text-slate-500 font-bold uppercase px-2 py-0.5 rounded">
                                                        {c.perfil}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <p className="text-sm text-slate-700 font-medium">{c.correo}</p>
                                        {c.celular && (
                                            <p className="text-xs text-slate-400">{c.celular}</p>
                                        )}
                                    </td>
                                    <td className="p-4 text-sm text-slate-600">{c.ciudad || '—'}</td>
                                    <td className="p-4 text-center">
                                        {c._origen === 'web' ? (
                                            <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-black uppercase px-2.5 py-1 rounded-full">
                                                <Globe size={10} /> Web
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 text-[9px] font-black uppercase px-2.5 py-1 rounded-full">
                                                <Monitor size={10} /> CRM
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-4 text-center text-xs text-slate-400 font-medium">
                                        {formatFecha(c.fechaAlta)}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* ── MODAL Alta manual ─────────────────────────────────────────────── */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="bg-blue-600 p-5 text-white flex justify-between items-center">
                            <div>
                                <h3 className="font-black uppercase tracking-tight text-sm">Nuevo Cliente</h3>
                                <p className="text-blue-200 text-[10px] mt-0.5">Alta manual en el CRM</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="hover:rotate-90 transition-transform text-xl">✕</button>
                        </div>
                        <form onSubmit={guardarCliente} className="p-6 space-y-4">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Nombre Completo</label>
                                <input required className="w-full border-2 border-gray-100 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" type="text"
                                    onChange={e => setNuevoCliente({ ...nuevoCliente, nombre: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Celular</label>
                                    <input className="w-full border-2 border-gray-100 rounded-xl p-2.5 text-sm outline-none" type="text"
                                        onChange={e => setNuevoCliente({ ...nuevoCliente, celular: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Ciudad</label>
                                    <input className="w-full border-2 border-gray-100 rounded-xl p-2.5 text-sm outline-none" type="text"
                                        onChange={e => setNuevoCliente({ ...nuevoCliente, ciudad: e.target.value })} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Correo</label>
                                <input className="w-full border-2 border-gray-100 rounded-xl p-2.5 text-sm outline-none" type="email"
                                    onChange={e => setNuevoCliente({ ...nuevoCliente, correo: e.target.value })} />
                            </div>
                            <button type="submit" className="w-full bg-blue-600 text-white font-black py-3 rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all uppercase tracking-widest text-xs">
                                Guardar Cliente
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}