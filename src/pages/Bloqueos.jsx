import { useEffect, useState } from 'react';
import { db } from '../firebaseConfig';
import { collection, onSnapshot, addDoc, query, orderBy, getDocs } from 'firebase/firestore';
import { Lock, Plus, Landmark, Hotel, Plane, Package, Bus, X } from 'lucide-react';

// ── Config de tipos de bloqueo ────────────────────────────────────────
const TIPOS = [
    { key: 'hotel', label: 'Hotel', icon: Hotel, color: 'blue', bg: 'bg-blue-600', light: 'bg-blue-50 text-blue-700 border-blue-200' },
    { key: 'avion', label: 'Avión', icon: Plane, color: 'violet', bg: 'bg-violet-600', light: 'bg-violet-50 text-violet-700 border-violet-200' },
    { key: 'paquete', label: 'Paquete', icon: Package, color: 'emerald', bg: 'bg-emerald-600', light: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    { key: 'autobus', label: 'Autobús', icon: Bus, color: 'orange', bg: 'bg-orange-600', light: 'bg-orange-50 text-orange-700 border-orange-200' },
];

// ── Campos adicionales según tipo ─────────────────────────────────────
const CAMPOS_EXTRA = {
    hotel: [
        { key: 'nombreHotel', label: 'Nombre del Hotel', type: 'text', placeholder: 'Ej. Grand Velas Riviera Maya' },
        { key: 'habitaciones', label: 'Tipo de Habitación', type: 'text', placeholder: 'Ej. Suite Junior, Deluxe...' },
        { key: 'plan', label: 'Plan (AI/EP/BP)', type: 'text', placeholder: 'Ej. Todo Incluido' },
    ],
    avion: [
        { key: 'aerolinea', label: 'Aerolínea', type: 'text', placeholder: 'Ej. Aeroméxico, Volaris...' },
        { key: 'vuelo', label: 'Número de Vuelo', type: 'text', placeholder: 'Ej. AM 123' },
        { key: 'origen', label: 'Origen', type: 'text', placeholder: 'Ej. GDL' },
        { key: 'destino', label: 'Destino', type: 'text', placeholder: 'Ej. CUN' },
        { key: 'horaSalida', label: 'Hora de Salida', type: 'time', placeholder: '' },
    ],
    paquete: [
        { key: 'destino', label: 'Destino del Paquete', type: 'text', placeholder: 'Ej. Cancún All Inclusive' },
        { key: 'noches', label: 'Número de Noches', type: 'number', placeholder: '5' },
        { key: 'incluye', label: 'Qué incluye', type: 'text', placeholder: 'Vuelo + Hotel + Traslado...' },
    ],
    autobus: [
        { key: 'empresaBus', label: 'Empresa de Transporte', type: 'text', placeholder: 'Ej. ETN, Primera Plus...' },
        { key: 'ruta', label: 'Ruta', type: 'text', placeholder: 'Ej. GDL → CUN' },
        { key: 'numeroBus', label: 'Unidad / Autobus No.', type: 'text', placeholder: 'Ej. Bus #4' },
    ],
};

const getTipoConfig = (key) => TIPOS.find(t => t.key === key) || TIPOS[3];

export default function Bloqueos() {
    const [bloqueos, setBloqueos] = useState([]);
    const [empresas, setEmpresas] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [tipoSeleccionado, setTipo] = useState('');
    const [nuevoBloqueo, setNuevoBloqueo] = useState({
        tipo: '',
        empresaId: '',
        nombreViaje: '',
        totalLugares: 0,
        lugaresVendidos: 0,
        fechaSalida: '',
        costoUnitario: 0,
    });

    const set = (campo, valor) => setNuevoBloqueo(p => ({ ...p, [campo]: valor }));

    const resetModal = () => {
        setShowModal(false);
        setTipo('');
        setNuevoBloqueo({ tipo: '', empresaId: '', nombreViaje: '', totalLugares: 0, lugaresVendidos: 0, fechaSalida: '', costoUnitario: 0 });
    };

    useEffect(() => {
        const q = query(collection(db, 'bloqueos'), orderBy('fechaSalida', 'asc'));
        const unsub = onSnapshot(q, snap => setBloqueos(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
        getDocs(collection(db, 'empresas')).then(snap =>
            setEmpresas(snap.docs.map(d => ({ id: d.id, nombre: d.data().nombreComercial })))
        );
        return () => unsub();
    }, []);

    const guardarBloqueo = async (e) => {
        e.preventDefault();
        const empresa = empresas.find(emp => emp.id === nuevoBloqueo.empresaId);
        try {
            await addDoc(collection(db, 'bloqueos'), {
                ...nuevoBloqueo,
                tipo: tipoSeleccionado,
                nombreEmpresa: empresa?.nombre || 'Proveedor',
                fechaRegistro: new Date(),
                disponibles: Number(nuevoBloqueo.totalLugares),
                lugaresVendidos: 0,
            });
            resetModal();
        } catch (err) { console.error(err); }
    };

    // ── Filtro por tipo en la vista ─────────────────────────────────
    const [filtroTipo, setFiltroTipo] = useState('todos');
    const bloqueosFiltrados = filtroTipo === 'todos'
        ? bloqueos
        : bloqueos.filter(b => b.tipo === filtroTipo);

    return (
        <div className="space-y-6">

            {/* ── Header ── */}
            <div className="flex flex-wrap justify-between items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div>
                    <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                        Panel de Bloqueos <Lock className="text-orange-500" size={22} />
                    </h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                        Control de inventario por tipo
                    </p>
                </div>
                <button onClick={() => setShowModal(true)}
                    className="bg-orange-600 hover:bg-orange-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-lg transition-all font-bold text-sm">
                    <Plus size={18} /> Nuevo Bloqueo
                </button>
            </div>

            {/* ── Filtros por tipo ── */}
            <div className="flex flex-wrap gap-2">
                <button onClick={() => setFiltroTipo('todos')}
                    className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wide border-2 transition-all ${filtroTipo === 'todos' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-500 border-slate-100 hover:border-slate-300'}`}>
                    Todos ({bloqueos.length})
                </button>
                {TIPOS.map(({ key, label, icon: Icon, bg, light }) => {
                    const count = bloqueos.filter(b => b.tipo === key).length;
                    return (
                        <button key={key} onClick={() => setFiltroTipo(key)}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wide border-2 transition-all ${filtroTipo === key ? `${bg} text-white border-transparent shadow-md` : `bg-white border-slate-100 text-slate-500 hover:border-slate-300`}`}>
                            <Icon size={13} /> {label} ({count})
                        </button>
                    );
                })}
            </div>

            {/* ── Grid de bloqueos ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {bloqueosFiltrados.length === 0 && (
                    <div className="col-span-3 text-center py-16 text-slate-300">
                        <Lock size={40} className="mx-auto mb-3 opacity-30" />
                        <p className="font-bold text-sm">No hay bloqueos de este tipo</p>
                    </div>
                )}
                {bloqueosFiltrados.map(bloqueo => {
                    const tipo = getTipoConfig(bloqueo.tipo);
                    const Icon = tipo.icon;
                    const porcentaje = bloqueo.totalLugares > 0
                        ? Math.round((bloqueo.lugaresVendidos / bloqueo.totalLugares) * 100)
                        : 0;
                    const disponibles = bloqueo.totalLugares - (bloqueo.lugaresVendidos || 0);

                    return (
                        <div key={bloqueo.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
                            {/* Top */}
                            <div className="flex justify-between items-start mb-4">
                                <div className={`p-2.5 rounded-xl ${tipo.light} border`}>
                                    <Icon size={20} />
                                </div>
                                <div className="text-right">
                                    <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${tipo.light}`}>
                                        {tipo.label}
                                    </span>
                                    <p className="text-xs text-slate-400 mt-1">{bloqueo.fechaSalida}</p>
                                </div>
                            </div>

                            {/* Nombre */}
                            <h3 className="font-black text-slate-800 text-base mb-1 leading-tight">{bloqueo.nombreViaje}</h3>
                            <p className="text-xs text-blue-500 font-bold flex items-center gap-1 mb-4">
                                <Landmark size={11} /> {bloqueo.nombreEmpresa}
                            </p>

                            {/* Campos extra del tipo */}
                            {bloqueo.tipo === 'avion' && bloqueo.origen && (
                                <p className="text-xs text-slate-500 mb-3 font-medium">
                                    ✈️ {bloqueo.origen} → {bloqueo.destino} {bloqueo.horaSalida && `· ${bloqueo.horaSalida}`}
                                </p>
                            )}
                            {bloqueo.tipo === 'hotel' && bloqueo.nombreHotel && (
                                <p className="text-xs text-slate-500 mb-3 font-medium">
                                    🏨 {bloqueo.nombreHotel} {bloqueo.habitaciones && `· ${bloqueo.habitaciones}`}
                                </p>
                            )}
                            {bloqueo.tipo === 'paquete' && bloqueo.noches && (
                                <p className="text-xs text-slate-500 mb-3 font-medium">
                                    📦 {bloqueo.noches} noches {bloqueo.incluye && `· ${bloqueo.incluye}`}
                                </p>
                            )}
                            {bloqueo.tipo === 'autobus' && bloqueo.ruta && (
                                <p className="text-xs text-slate-500 mb-3 font-medium">
                                    🚌 {bloqueo.ruta} {bloqueo.numeroBus && `· ${bloqueo.numeroBus}`}
                                </p>
                            )}

                            {/* Ocupación */}
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs font-bold text-slate-600">
                                    <span>Ocupación</span>
                                    <span>{bloqueo.lugaresVendidos || 0} / {bloqueo.totalLugares} lugares</span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-2">
                                    <div
                                        className={`h-2 rounded-full transition-all ${porcentaje > 85 ? 'bg-red-500' : porcentaje > 60 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                        style={{ width: `${porcentaje}%` }}
                                    />
                                </div>
                                <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                                    <span>{porcentaje}% ocupado</span>
                                    <span>{disponibles} disponibles</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ══════════════════════════════════════════════════
                MODAL NUEVO BLOQUEO
            ══════════════════════════════════════════════════ */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] overflow-y-auto">

                        {/* Header */}
                        <div className="bg-orange-600 p-5 text-white flex justify-between items-center sticky top-0">
                            <div>
                                <h3 className="font-black uppercase tracking-tight text-sm">Nuevo Bloqueo</h3>
                                <p className="text-orange-200 text-[10px] mt-0.5">Selecciona el tipo e ingresa los datos</p>
                            </div>
                            <button onClick={resetModal} className="p-1 hover:rotate-90 transition-transform text-xl">✕</button>
                        </div>

                        <div className="p-6 space-y-5">

                            {/* ── PASO 1: Selector de tipo ── */}
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                                    Tipo de bloqueo *
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    {TIPOS.map(({ key, label, icon: Icon, bg, light }) => (
                                        <button
                                            key={key}
                                            type="button"
                                            onClick={() => setTipo(key)}
                                            className={`flex items-center gap-3 p-4 rounded-2xl border-2 font-bold text-sm transition-all ${tipoSeleccionado === key
                                                    ? `${bg} text-white border-transparent shadow-lg`
                                                    : 'border-slate-100 text-slate-600 hover:border-slate-300 bg-slate-50'
                                                }`}
                                        >
                                            <Icon size={20} />
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* ── PASO 2: Campos (solo si hay tipo seleccionado) ── */}
                            {tipoSeleccionado && (
                                <form onSubmit={guardarBloqueo} className="space-y-4">

                                    {/* Proveedor */}
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Proveedor / Empresa</label>
                                        <select required className="w-full border-2 border-slate-100 rounded-xl p-2.5 text-sm outline-none focus:border-orange-400"
                                            onChange={e => set('empresaId', e.target.value)}>
                                            <option value="">Selecciona empresa</option>
                                            {empresas.map(emp => <option key={emp.id} value={emp.id}>{emp.nombre}</option>)}
                                        </select>
                                    </div>

                                    {/* Nombre del viaje/grupo */}
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Nombre del grupo / viaje</label>
                                        <input required type="text" placeholder="Ej. Convención Cancún Marzo"
                                            className="w-full border-2 border-slate-100 rounded-xl p-2.5 text-sm outline-none focus:border-orange-400"
                                            onChange={e => set('nombreViaje', e.target.value)} />
                                    </div>

                                    {/* Campos específicos del tipo */}
                                    {CAMPOS_EXTRA[tipoSeleccionado]?.map(campo => (
                                        <div key={campo.key}>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{campo.label}</label>
                                            <input type={campo.type} placeholder={campo.placeholder}
                                                className="w-full border-2 border-slate-100 rounded-xl p-2.5 text-sm outline-none focus:border-orange-400"
                                                onChange={e => set(campo.key, e.target.value)} />
                                        </div>
                                    ))}

                                    {/* Lugares y fecha */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Total de lugares</label>
                                            <input required type="number" min="1"
                                                className="w-full border-2 border-slate-100 rounded-xl p-2.5 text-sm outline-none focus:border-orange-400"
                                                onChange={e => set('totalLugares', parseInt(e.target.value))} />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Fecha de salida</label>
                                            <input required type="date"
                                                className="w-full border-2 border-slate-100 rounded-xl p-2.5 text-sm outline-none focus:border-orange-400"
                                                onChange={e => set('fechaSalida', e.target.value)} />
                                        </div>
                                    </div>

                                    {/* Costo */}
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Costo unitario ($)</label>
                                        <input type="number" min="0" placeholder="0.00"
                                            className="w-full border-2 border-slate-100 rounded-xl p-2.5 text-sm outline-none focus:border-orange-400"
                                            onChange={e => set('costoUnitario', parseFloat(e.target.value))} />
                                    </div>

                                    <button type="submit"
                                        className="w-full bg-orange-600 hover:bg-orange-700 text-white font-black py-3.5 rounded-2xl transition-all shadow-xl shadow-orange-100 uppercase tracking-widest text-xs">
                                        Crear Bloqueo de {TIPOS.find(t => t.key === tipoSeleccionado)?.label}
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}