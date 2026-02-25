import { useEffect, useState } from 'react';
import { db } from '../../firebaseConfig';
import {
    collection, onSnapshot, addDoc, query, orderBy,
    doc, deleteDoc, updateDoc
} from 'firebase/firestore';
import {
    Package, Plus, Search, MapPin, Calendar, Edit, Trash2,
    Plane, Hotel, Bus, Star, DollarSign, Users, Tag,
    CheckCircle, XCircle, Clock, Filter, ChevronDown, X, Image
} from 'lucide-react';

const TIPOS_PAQUETE = ['Paquete Completo', 'Solo Hotel', 'Solo Vuelo', 'Tour / Excursión', 'Crucero', 'Escapada Nacional', 'Luna de Miel', 'Grupos'];
const PLANES_ALIMENTO = ['Todo Incluido (AI)', 'Solo Alojamiento (EP)', 'Desayuno Incluido (BP)', 'Media Pensión (MAP)', 'Pensión Completa (AP)'];
const TEMPORADAS = ['Todo el año', 'Temporada Alta', 'Temporada Baja', 'Solo Verano', 'Solo Diciembre', 'Semana Santa'];
const ESTATUS_OPTS = ['Activo', 'Pausado', 'Agotado', 'Próximamente'];

const ESTATUS_STYLE = {
    'Activo': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: <CheckCircle size={10} /> },
    'Pausado': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: <Clock size={10} /> },
    'Agotado': { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200', icon: <XCircle size={10} /> },
    'Próximamente': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', icon: <Clock size={10} /> },
};

const FORM_INICIAL = {
    nombrePaquete: '', destino: '', tipoPaquete: '', duracion: '',
    noches: '', hotel: '', categoriaHotel: '', planAlimentacion: '',
    aerolinea: '', claseVuelo: '', incluyeTraslados: false,
    precioBase: '', precioNeto: '', moneda: 'MXN',
    cuposTotal: '', cuposDisponibles: '',
    temporada: '', fechaInicioVigencia: '', fechaFinVigencia: '',
    incluye: '', noIncluye: '', observaciones: '',
    imagenUrl: '', estatus: 'Activo', destacado: false
};

const Lbl = ({ children }) => (
    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{children}</label>
);
const Input = (props) => (
    <input {...props} className={`w-full border-2 border-slate-100 rounded-xl p-2.5 text-sm outline-none focus:border-blue-400 transition-all ${props.className || ''}`} />
);
const Sel = ({ children, ...props }) => (
    <select {...props} className={`w-full border-2 border-slate-100 rounded-xl p-2.5 text-sm outline-none focus:border-blue-400 ${props.className || ''}`}>
        {children}
    </select>
);

export default function DirectorioPaquetes() {
    const [paquetes, setPaquetes] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [busqueda, setBusqueda] = useState('');
    const [filtroTipo, setFiltroTipo] = useState('');
    const [filtroEstatus, setFiltroEstatus] = useState('');
    const [form, setForm] = useState(FORM_INICIAL);
    const [guardando, setGuardando] = useState(false);

    const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

    useEffect(() => {
        const q = query(collection(db, 'paquetes'), orderBy('nombrePaquete', 'asc'));
        return onSnapshot(q, snap =>
            setPaquetes(snap.docs.map(d => ({ id: d.id, ...d.data() })))
        );
    }, []);

    const openCreate = () => { setForm(FORM_INICIAL); setEditingId(null); setShowModal(true); };
    const openEdit = (p) => { setForm({ ...FORM_INICIAL, ...p }); setEditingId(p.id); setShowModal(true); };
    const closeModal = () => { setShowModal(false); setEditingId(null); };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setGuardando(true);
        try {
            if (editingId) {
                await updateDoc(doc(db, 'paquetes', editingId), { ...form });
            } else {
                await addDoc(collection(db, 'paquetes'), {
                    ...form,
                    precioBase: Number(form.precioBase),
                    precioNeto: Number(form.precioNeto),
                    cuposTotal: Number(form.cuposTotal),
                    cuposDisponibles: Number(form.cuposDisponibles || form.cuposTotal),
                    fechaCreacion: new Date().toISOString(),
                });
            }
            closeModal();
        } catch (err) { console.error(err); }
        setGuardando(false);
    };

    const eliminar = async (id) => {
        if (!window.confirm('¿Eliminar este paquete del catálogo?')) return;
        await deleteDoc(doc(db, 'paquetes', id));
    };

    // Filtros
    const filtrados = paquetes.filter(p => {
        const txt = busqueda.toLowerCase();
        const matchBusq = !busqueda ||
            p.nombrePaquete?.toLowerCase().includes(txt) ||
            p.destino?.toLowerCase().includes(txt) ||
            p.hotel?.toLowerCase().includes(txt);
        const matchTipo = !filtroTipo || p.tipoPaquete === filtroTipo;
        const matchStatus = !filtroEstatus || p.estatus === filtroEstatus;
        return matchBusq && matchTipo && matchStatus;
    });

    // KPIs
    const totalActivos = paquetes.filter(p => p.estatus === 'Activo').length;
    const totalAgotados = paquetes.filter(p => p.estatus === 'Agotado').length;
    const precioPromedio = paquetes.length
        ? (paquetes.reduce((a, p) => a + Number(p.precioBase || 0), 0) / paquetes.length)
        : 0;

    return (
        <div className="space-y-6 pb-10">

            {/* ── Header ── */}
            <div className="flex flex-wrap justify-between items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div>
                    <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter flex items-center gap-2">
                        Directorio de Paquetes <Package className="text-blue-600" size={24} />
                    </h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                        Catálogo de ofertas comerciales · {paquetes.length} paquetes registrados
                    </p>
                </div>
                <button onClick={openCreate}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 font-bold text-sm transition-all shadow-lg shadow-blue-200">
                    <Plus size={18} /> Nuevo Paquete
                </button>
            </div>

            {/* ── KPIs ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total paquetes', value: paquetes.length, color: 'blue', icon: <Package size={16} /> },
                    { label: 'Activos', value: totalActivos, color: 'emerald', icon: <CheckCircle size={16} /> },
                    { label: 'Agotados', value: totalAgotados, color: 'red', icon: <XCircle size={16} /> },
                    { label: 'Precio promedio', value: `$${Math.round(precioPromedio).toLocaleString()}`, color: 'amber', icon: <DollarSign size={16} /> },
                ].map(k => (
                    <div key={k.label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-3">
                        <div className={`bg-${k.color}-50 text-${k.color}-600 p-2.5 rounded-xl flex-shrink-0`}>{k.icon}</div>
                        <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-wide">{k.label}</p>
                            <p className={`text-xl font-black text-${k.color}-700`}>{k.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Filtros ── */}
            <div className="flex flex-wrap gap-3 items-center">
                <div className="relative flex-1 min-w-[220px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                    <input type="text" placeholder="Buscar por nombre, destino, hotel..."
                        value={busqueda} onChange={e => setBusqueda(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 border-2 border-slate-100 rounded-xl text-sm outline-none focus:border-blue-400 transition-all" />
                </div>
                <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}
                    className="border-2 border-slate-100 rounded-xl px-3 py-2.5 text-xs font-bold outline-none focus:border-blue-400 text-slate-600 bg-white">
                    <option value="">Todos los tipos</option>
                    {TIPOS_PAQUETE.map(t => <option key={t}>{t}</option>)}
                </select>
                <select value={filtroEstatus} onChange={e => setFiltroEstatus(e.target.value)}
                    className="border-2 border-slate-100 rounded-xl px-3 py-2.5 text-xs font-bold outline-none focus:border-blue-400 text-slate-600 bg-white">
                    <option value="">Todos los estatus</option>
                    {ESTATUS_OPTS.map(s => <option key={s}>{s}</option>)}
                </select>
                {(busqueda || filtroTipo || filtroEstatus) && (
                    <button onClick={() => { setBusqueda(''); setFiltroTipo(''); setFiltroEstatus(''); }}
                        className="text-xs font-black text-slate-400 hover:text-red-500 flex items-center gap-1 transition-colors">
                        <X size={13} /> Limpiar
                    </button>
                )}
                <span className="text-[10px] font-black text-slate-400 ml-auto">{filtrados.length} resultados</span>
            </div>

            {/* ── Grid de tarjetas ── */}
            {filtrados.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center">
                    <Package size={40} className="text-slate-200 mx-auto mb-3" />
                    <p className="text-slate-300 font-bold text-sm">No hay paquetes con ese criterio</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filtrados.map(p => {
                        const est = ESTATUS_STYLE[p.estatus] || ESTATUS_STYLE['Activo'];
                        const ocup = p.cuposTotal > 0
                            ? Math.round(((p.cuposTotal - (p.cuposDisponibles || 0)) / p.cuposTotal) * 100)
                            : 0;
                        return (
                            <div key={p.id} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-lg transition-all group overflow-hidden flex flex-col">

                                {/* Imagen / portada */}
                                {p.imagenUrl ? (
                                    <div className="h-36 overflow-hidden">
                                        <img src={p.imagenUrl} alt={p.nombrePaquete}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    </div>
                                ) : (
                                    <div className="h-28 bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
                                        <Package size={36} className="text-white/30" />
                                    </div>
                                )}

                                <div className="p-5 flex flex-col flex-1">
                                    {/* Badges */}
                                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                                        <span className={`inline-flex items-center gap-1 text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${est.bg} ${est.text} ${est.border}`}>
                                            {est.icon} {p.estatus}
                                        </span>
                                        {p.tipoPaquete && (
                                            <span className="text-[9px] font-black text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full uppercase">
                                                {p.tipoPaquete}
                                            </span>
                                        )}
                                        {p.destacado && (
                                            <Star size={13} className="text-amber-400 fill-amber-400 ml-auto" />
                                        )}
                                    </div>

                                    <h3 className="font-black text-slate-800 uppercase text-sm leading-tight mb-2">{p.nombrePaquete}</h3>

                                    {/* Datos clave */}
                                    <div className="space-y-1.5 mb-4">
                                        {p.destino && (
                                            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold">
                                                <MapPin size={12} className="text-red-400 flex-shrink-0" /> {p.destino}
                                            </div>
                                        )}
                                        {p.duracion && (
                                            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold">
                                                <Calendar size={12} className="text-blue-400 flex-shrink-0" /> {p.duracion}
                                            </div>
                                        )}
                                        {p.hotel && (
                                            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold">
                                                <Hotel size={12} className="text-violet-400 flex-shrink-0" /> {p.hotel} {p.categoriaHotel || ''}
                                            </div>
                                        )}
                                        {p.aerolinea && (
                                            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold">
                                                <Plane size={12} className="text-sky-400 flex-shrink-0" /> {p.aerolinea} {p.claseVuelo ? `· ${p.claseVuelo}` : ''}
                                            </div>
                                        )}
                                        {p.planAlimentacion && (
                                            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold">
                                                <Tag size={12} className="text-emerald-400 flex-shrink-0" /> {p.planAlimentacion}
                                            </div>
                                        )}
                                    </div>

                                    {/* Cupos */}
                                    {p.cuposTotal > 0 && (
                                        <div className="mb-4">
                                            <div className="flex justify-between text-[9px] font-black text-slate-400 uppercase mb-1">
                                                <span>Cupos</span>
                                                <span>{p.cuposDisponibles ?? p.cuposTotal} / {p.cuposTotal} disponibles</span>
                                            </div>
                                            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all ${ocup < 60 ? 'bg-emerald-400' : ocup < 85 ? 'bg-amber-400' : 'bg-red-400'}`}
                                                    style={{ width: `${ocup}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Incluye (recortado) */}
                                    {p.incluye && (
                                        <div className="bg-slate-50 rounded-xl p-3 mb-4 text-[10px] text-slate-500 line-clamp-2 italic flex-1">
                                            {p.incluye}
                                        </div>
                                    )}

                                    {/* Footer precio + acciones */}
                                    <div className="flex items-end justify-between mt-auto">
                                        <div>
                                            {p.precioNeto > 0 && (
                                                <p className="text-[9px] text-slate-400 font-black uppercase">Neto: ${Number(p.precioNeto).toLocaleString()}</p>
                                            )}
                                            <p className="text-xl font-black text-slate-800">
                                                ${Number(p.precioBase).toLocaleString()}
                                                <span className="text-[10px] font-normal text-slate-400 ml-1">{p.moneda || 'MXN'}</span>
                                            </p>
                                        </div>
                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => openEdit(p)}
                                                className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl transition-all">
                                                <Edit size={14} />
                                            </button>
                                            <button onClick={() => eliminar(p.id)}
                                                className="p-2 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ══════════════ MODAL ALTA / EDICIÓN ══════════════ */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto">
                        {/* Header modal */}
                        <div className="bg-blue-600 p-5 text-white flex justify-between items-center sticky top-0 z-10">
                            <div>
                                <h3 className="font-black uppercase text-sm tracking-tight">
                                    {editingId ? 'Editar Paquete' : 'Nuevo Paquete al Catálogo'}
                                </h3>
                                <p className="text-blue-200 text-[10px]">Evelux Viajes · Directorio de Productos</p>
                            </div>
                            <button onClick={closeModal} className="hover:rotate-90 transition-transform text-xl">✕</button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">

                            {/* ─ Bloque 1: Identificación ─ */}
                            <Bloque titulo="Identificación" color="blue">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <Lbl>Nombre del paquete *</Lbl>
                                        <Input required value={form.nombrePaquete} onChange={e => set('nombrePaquete', e.target.value)} placeholder="Ej. CANCÚN TODO INCLUIDO 7 NOCHES" className="uppercase" />
                                    </div>
                                    <div>
                                        <Lbl>Tipo de paquete</Lbl>
                                        <Sel value={form.tipoPaquete} onChange={e => set('tipoPaquete', e.target.value)}>
                                            <option value="">— Seleccionar —</option>
                                            {TIPOS_PAQUETE.map(t => <option key={t}>{t}</option>)}
                                        </Sel>
                                    </div>
                                    <div>
                                        <Lbl>Estatus</Lbl>
                                        <Sel value={form.estatus} onChange={e => set('estatus', e.target.value)}>
                                            {ESTATUS_OPTS.map(s => <option key={s}>{s}</option>)}
                                        </Sel>
                                    </div>
                                    <div className="md:col-span-2 flex items-center gap-3 bg-amber-50 rounded-xl p-3 border border-amber-100">
                                        <input type="checkbox" id="destacado" checked={form.destacado}
                                            onChange={e => set('destacado', e.target.checked)}
                                            className="w-4 h-4 accent-amber-500" />
                                        <label htmlFor="destacado" className="text-xs font-black text-amber-700 uppercase cursor-pointer">
                                            ⭐ Marcar como paquete destacado
                                        </label>
                                    </div>
                                </div>
                            </Bloque>

                            {/* ─ Bloque 2: Destino & Fechas ─ */}
                            <Bloque titulo="Destino & Duración" color="emerald">
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    <div className="col-span-2 md:col-span-3">
                                        <Lbl>Destino *</Lbl>
                                        <Input required value={form.destino} onChange={e => set('destino', e.target.value)} placeholder="Ej. Cancún, Riviera Maya" />
                                    </div>
                                    <div>
                                        <Lbl>Duración</Lbl>
                                        <Input value={form.duracion} onChange={e => set('duracion', e.target.value)} placeholder="7 Días / 6 Noches" />
                                    </div>
                                    <div>
                                        <Lbl>Noches</Lbl>
                                        <Input type="number" min="1" value={form.noches} onChange={e => set('noches', e.target.value)} />
                                    </div>
                                    <div>
                                        <Lbl>Temporada</Lbl>
                                        <Sel value={form.temporada} onChange={e => set('temporada', e.target.value)}>
                                            <option value="">— Seleccionar —</option>
                                            {TEMPORADAS.map(t => <option key={t}>{t}</option>)}
                                        </Sel>
                                    </div>
                                    <div>
                                        <Lbl>Vigencia desde</Lbl>
                                        <Input type="date" value={form.fechaInicioVigencia} onChange={e => set('fechaInicioVigencia', e.target.value)} />
                                    </div>
                                    <div>
                                        <Lbl>Vigencia hasta</Lbl>
                                        <Input type="date" value={form.fechaFinVigencia} onChange={e => set('fechaFinVigencia', e.target.value)} />
                                    </div>
                                </div>
                            </Bloque>

                            {/* ─ Bloque 3: Hotel ─ */}
                            <Bloque titulo="Alojamiento" color="violet">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <Lbl>Hotel</Lbl>
                                        <Input value={form.hotel} onChange={e => set('hotel', e.target.value)} placeholder="Ej. Grand Velas Riviera Maya" />
                                    </div>
                                    <div>
                                        <Lbl>Categoría</Lbl>
                                        <Sel value={form.categoriaHotel} onChange={e => set('categoriaHotel', e.target.value)}>
                                            <option value="">— Seleccionar —</option>
                                            {['★★★', '★★★★', '★★★★★', 'Gran Turismo'].map(c => <option key={c}>{c}</option>)}
                                        </Sel>
                                    </div>
                                    <div>
                                        <Lbl>Plan alimentación</Lbl>
                                        <Sel value={form.planAlimentacion} onChange={e => set('planAlimentacion', e.target.value)}>
                                            <option value="">— Seleccionar —</option>
                                            {PLANES_ALIMENTO.map(p => <option key={p}>{p}</option>)}
                                        </Sel>
                                    </div>
                                </div>
                            </Bloque>

                            {/* ─ Bloque 4: Vuelo & Traslados ─ */}
                            <Bloque titulo="Vuelo & Traslados" color="sky">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Lbl>Aerolínea</Lbl>
                                        <Input value={form.aerolinea} onChange={e => set('aerolinea', e.target.value)} placeholder="Ej. Aeroméxico" />
                                    </div>
                                    <div>
                                        <Lbl>Clase de vuelo</Lbl>
                                        <Sel value={form.claseVuelo} onChange={e => set('claseVuelo', e.target.value)}>
                                            <option value="">— Clase —</option>
                                            {['Económica', 'Business', 'Primera Clase'].map(c => <option key={c}>{c}</option>)}
                                        </Sel>
                                    </div>
                                    <div className="col-span-2 flex items-center gap-3 bg-slate-50 rounded-xl p-3 border border-slate-100">
                                        <input type="checkbox" id="traslados" checked={form.incluyeTraslados}
                                            onChange={e => set('incluyeTraslados', e.target.checked)}
                                            className="w-4 h-4 accent-blue-500" />
                                        <label htmlFor="traslados" className="text-xs font-black text-slate-600 uppercase cursor-pointer">
                                            <Bus size={12} className="inline mr-1" /> Incluye traslados aeropuerto ↔ hotel
                                        </label>
                                    </div>
                                </div>
                            </Bloque>

                            {/* ─ Bloque 5: Cupos ─ */}
                            <Bloque titulo="Cupos" color="orange">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Lbl>Cupos totales</Lbl>
                                        <Input type="number" min="0" value={form.cuposTotal} onChange={e => set('cuposTotal', e.target.value)} placeholder="0" />
                                    </div>
                                    <div>
                                        <Lbl>Cupos disponibles</Lbl>
                                        <Input type="number" min="0" value={form.cuposDisponibles} onChange={e => set('cuposDisponibles', e.target.value)} placeholder="0" />
                                    </div>
                                </div>
                            </Bloque>

                            {/* ─ Bloque 6: Precios ─ */}
                            <Bloque titulo="Precios" color="emerald">
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <Lbl>Moneda</Lbl>
                                        <Sel value={form.moneda} onChange={e => set('moneda', e.target.value)}>
                                            <option>MXN</option><option>USD</option>
                                        </Sel>
                                    </div>
                                    <div>
                                        <Lbl>Precio público *</Lbl>
                                        <Input required type="number" min="0" value={form.precioBase}
                                            onChange={e => set('precioBase', e.target.value)} placeholder="0.00"
                                            className="text-blue-600 font-black" />
                                    </div>
                                    <div>
                                        <Lbl>Precio neto (interno)</Lbl>
                                        <Input type="number" min="0" value={form.precioNeto}
                                            onChange={e => set('precioNeto', e.target.value)} placeholder="0.00"
                                            className="text-slate-600" />
                                    </div>
                                </div>
                            </Bloque>

                            {/* ─ Bloque 7: Incluye / No incluye ─ */}
                            <Bloque titulo="Incluye / No incluye / Notas" color="slate">
                                <div className="space-y-4">
                                    <div>
                                        <Lbl>¿Qué incluye?</Lbl>
                                        <textarea rows={3} value={form.incluye} onChange={e => set('incluye', e.target.value)}
                                            placeholder="Vuelo redondo, hotel 5★ AI, traslados, seguro..."
                                            className="w-full border-2 border-slate-100 rounded-xl p-2.5 text-sm outline-none focus:border-blue-400 resize-none" />
                                    </div>
                                    <div>
                                        <Lbl>¿Qué NO incluye?</Lbl>
                                        <textarea rows={2} value={form.noIncluye} onChange={e => set('noIncluye', e.target.value)}
                                            placeholder="Gastos personales, propinas..."
                                            className="w-full border-2 border-slate-100 rounded-xl p-2.5 text-sm outline-none focus:border-blue-400 resize-none" />
                                    </div>
                                    <div>
                                        <Lbl>Observaciones / Condiciones</Lbl>
                                        <textarea rows={2} value={form.observaciones} onChange={e => set('observaciones', e.target.value)}
                                            placeholder="Condiciones de pago, cancelación..."
                                            className="w-full border-2 border-slate-100 rounded-xl p-2.5 text-sm outline-none focus:border-blue-400 resize-none" />
                                    </div>
                                    <div>
                                        <Lbl>URL de imagen de portada</Lbl>
                                        <Input type="url" value={form.imagenUrl} onChange={e => set('imagenUrl', e.target.value)} placeholder="https://..." />
                                    </div>
                                </div>
                            </Bloque>

                            <button type="submit" disabled={guardando}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-100 uppercase tracking-widest text-xs transition-all disabled:opacity-60">
                                {guardando ? 'Guardando...' : (editingId ? 'Actualizar Paquete' : 'Guardar en Catálogo')}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

function Bloque({ titulo, color = 'blue', children }) {
    return (
        <div className="space-y-3">
            <div className={`flex items-center gap-2 pb-2 border-b border-${color}-100`}>
                <span className={`w-2 h-2 rounded-full bg-${color}-400`} />
                <p className={`text-[10px] font-black text-${color}-600 uppercase tracking-widest`}>{titulo}</p>
            </div>
            {children}
        </div>
    );
}
