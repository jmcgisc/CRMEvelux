import { useEffect, useState } from 'react';
import { db } from '../firebaseConfig';
import { collection, onSnapshot, addDoc, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Search, Globe, Monitor, Users, Star, ExternalLink, Pencil, Check, X } from 'lucide-react';

export default function Clientes() {
    const navigate = useNavigate();
    const [clientesCRM, setClientesCRM] = useState([]);
    const [clientesWeb, setClientesWeb] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [busqueda, setBusqueda] = useState('');
    const [filtroOrigen, setFiltroOrigen] = useState('todos');
    const [nuevoCliente, setNuevoCliente] = useState({
        nombre: '', correo: '', celular: '', ciudad: '', perfil: 'Frecuente'
    });

    // Modal edición de puntos
    const [editPuntos, setEditPuntos] = useState(null); // { id, origen, nombre, puntosActuales }
    const [nuevoPuntaje, setNuevoPuntaje] = useState(0);
    const [motivoEdicion, setMotivoEdicion] = useState('');

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
                // Puntos del programa de lealtad
                puntos: doc.data().puntos ?? doc.data().points ?? null,
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

    // ── Abrir modal de edición de puntos ──────────────────────────────
    const abrirEditPuntos = (c) => {
        setEditPuntos({ id: c.id, origen: c._origen, nombre: c.nombre, puntosActuales: c.puntos ?? 0 });
        setNuevoPuntaje(c.puntos ?? 0);
        setMotivoEdicion('');
    };

    // ── Guardar puntos editados en Firestore ──────────────────────────
    const guardarPuntos = async () => {
        if (!editPuntos) return;
        const coleccion = editPuntos.origen === 'web' ? 'users' : 'clientes';
        try {
            await updateDoc(doc(db, coleccion, editPuntos.id), { puntos: Number(nuevoPuntaje) });
            setEditPuntos(null);
        } catch (err) { console.error(err); alert('Error al actualizar puntos.'); }
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
                            <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Puntos</th>
                            <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Origen</th>
                            <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Alta</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {todosLosClientes.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="p-12 text-center text-slate-300 text-sm font-semibold">
                                    No se encontraron clientes con ese criterio.
                                </td>
                            </tr>
                        ) : (
                            todosLosClientes.map(c => (
                                <tr key={`${c._origen}-${c.id}`} className="hover:bg-blue-50/30 transition-colors group">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            {c.foto ? (
                                                <img src={c.foto} alt={c.nombre} className="w-9 h-9 rounded-full object-cover border-2 border-white shadow" />
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
                                        {c.celular && <p className="text-xs text-slate-400">{c.celular}</p>}
                                    </td>
                                    <td className="p-4 text-sm text-slate-600">{c.ciudad || '—'}</td>

                                    {/* ── Columna Puntos (con botón editar) ── */}
                                    <td className="p-4 text-center">
                                        <div className="flex items-center justify-center gap-2 group/pts">
                                            {/* Badge de puntos */}
                                            {c.puntos != null && Number(c.puntos) > 0 ? (
                                                <div className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-700 font-black text-sm px-3 py-1 rounded-full">
                                                    <Star size={12} className="fill-amber-400 text-amber-400" />
                                                    {Number(c.puntos).toLocaleString()}
                                                </div>
                                            ) : (
                                                <span className="text-slate-300 text-xs font-bold">0</span>
                                            )}
                                            {/* Botón editar (siempre visible para ambos orígenes) */}
                                            <button
                                                onClick={() => abrirEditPuntos(c)}
                                                title="Editar puntos"
                                                className="opacity-0 group-hover/pts:opacity-100 transition-opacity p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-500 hover:text-amber-700"
                                            >
                                                <Pencil size={12} />
                                            </button>
                                        </div>
                                    </td>

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
                                    {/* Botón ver detalle solo para usuarios Web */}
                                    {c._origen === 'web' && (
                                        <td className="p-4 text-center">
                                            <button
                                                onClick={() => navigate(`/directorios/clientes/${c.id}`)}
                                                className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-black text-xs uppercase tracking-wide transition-colors mx-auto"
                                            >
                                                <ExternalLink size={13} /> Ver perfil
                                            </button>
                                        </td>
                                    )}
                                    {c._origen !== 'web' && <td className="p-4" />}
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
            {/* ── MODAL Editar Puntos ─────────────────────────────────────── */}
            {editPuntos && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[200] p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
                        {/* Header */}
                        <div className="bg-amber-500 p-5 text-white flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <Star size={18} className="fill-white" />
                                <div>
                                    <h3 className="font-black uppercase text-sm tracking-tight">Editar Puntos</h3>
                                    <p className="text-amber-100 text-[10px] truncate max-w-[200px]">{editPuntos.nombre}</p>
                                </div>
                            </div>
                            <button onClick={() => setEditPuntos(null)} className="hover:rotate-90 transition-transform text-xl">✕</button>
                        </div>

                        <div className="p-6 space-y-5">
                            {/* Puntaje actual vs nuevo */}
                            <div className="bg-amber-50 rounded-2xl p-4 flex items-center justify-between border border-amber-100">
                                <div className="text-center">
                                    <p className="text-[9px] font-black text-amber-500 uppercase">Actual</p>
                                    <p className="text-2xl font-black text-amber-700">{Number(editPuntos.puntosActuales ?? nuevoPuntaje).toLocaleString()}</p>
                                </div>
                                <div className="text-amber-300 font-black text-xl">→</div>
                                <div className="text-center">
                                    <p className="text-[9px] font-black text-amber-500 uppercase">Nuevo</p>
                                    <p className="text-2xl font-black text-amber-700">{Number(nuevoPuntaje).toLocaleString()}</p>
                                </div>
                            </div>

                            {/* Input de puntos */}
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Puntos a asignar</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={nuevoPuntaje}
                                    className="w-full border-2 border-amber-200 rounded-2xl p-3 text-2xl font-black text-amber-700 text-center outline-none focus:border-amber-400 transition-all"
                                    onChange={e => setNuevoPuntaje(Math.max(0, Number(e.target.value)))}
                                />
                                {/* Atajos rápidos */}
                                <div className="flex gap-2 mt-2 flex-wrap">
                                    {[100, 250, 500, 1000].map(n => (
                                        <button key={n} type="button"
                                            onClick={() => setNuevoPuntaje(p => Number(p) + n)}
                                            className="flex-1 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 font-black text-[10px] rounded-xl uppercase transition-all border border-amber-100">
                                            +{n}
                                        </button>
                                    ))}
                                    <button type="button"
                                        onClick={() => setNuevoPuntaje(0)}
                                        className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-500 font-black text-[10px] rounded-xl uppercase transition-all border border-red-100">
                                        Reset
                                    </button>
                                </div>
                            </div>

                            {/* Motivo */}
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Motivo (opcional)</label>
                                <input
                                    type="text"
                                    placeholder="Ej. Bono por referido, corrección manual..."
                                    value={motivoEdicion}
                                    onChange={e => setMotivoEdicion(e.target.value)}
                                    className="w-full border-2 border-slate-100 rounded-xl p-2.5 text-sm outline-none focus:border-amber-400"
                                />
                            </div>

                            {/* Acciones */}
                            <div className="grid grid-cols-2 gap-3">
                                <button onClick={() => setEditPuntos(null)}
                                    className="flex items-center justify-center gap-1.5 py-3 rounded-2xl border-2 border-slate-100 text-slate-500 font-black text-xs uppercase hover:bg-slate-50 transition-all">
                                    <X size={14} /> Cancelar
                                </button>
                                <button onClick={guardarPuntos}
                                    className="flex items-center justify-center gap-1.5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs uppercase shadow-lg shadow-amber-100 transition-all">
                                    <Check size={14} /> Guardar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}