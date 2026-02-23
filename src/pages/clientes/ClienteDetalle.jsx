import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../firebaseConfig';
import {
    doc, getDoc, onSnapshot, collection, query, orderBy
} from 'firebase/firestore';
import {
    ArrowLeft, User, Plane, Bell, Ticket, Star, FileText,
    Phone, Mail, Calendar, MapPin, Shield, Heart, Users,
    ChevronRight, Gift, AlertCircle, CheckCircle, Clock, Globe
} from 'lucide-react';

// ── Helpers ──────────────────────────────────────────────────────────
const fmt = (fecha) => {
    if (!fecha) return '—';
    if (fecha?.toDate) return fecha.toDate().toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
    if (typeof fecha === 'string') return fecha;
    return '—';
};

const TABS = [
    { key: 'perfil', label: 'Perfil', icon: User },
    { key: 'viajes', label: 'Viajes', icon: Plane },
    { key: 'notificaciones', label: 'Notificaciones', icon: Bell },
    { key: 'cupones', label: 'Cupones', icon: Ticket },
];

const NIVEL_COLORS = {
    explorador: 'bg-sky-100 text-sky-700 border-sky-200',
    aventurero: 'bg-violet-100 text-violet-700 border-violet-200',
    elite: 'bg-amber-100 text-amber-700 border-amber-200',
    default: 'bg-slate-100 text-slate-600 border-slate-200',
};

export default function ClienteDetalle() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [tab, setTab] = useState('perfil');
    const [usuario, setUsuario] = useState(null);
    const [viajes, setViajes] = useState([]);
    const [notifs, setNotifs] = useState([]);
    const [cupones, setCupones] = useState([]);
    const [acompanantes, setAcompanantes] = useState([]);
    const [documentos, setDocumentos] = useState([]);
    const [loading, setLoading] = useState(true);

    // ── Perfil principal ─────────────────────────────────────────────
    useEffect(() => {
        const ref = doc(db, 'users', id);
        const unsub = onSnapshot(ref, (snap) => {
            if (snap.exists()) {
                setUsuario({ id: snap.id, ...snap.data() });
                // Personas adicionales pueden estar en el documento principal
                const data = snap.data();
                if (data.personasAdicionales || data.acompanantes) {
                    setAcompanantes(data.personasAdicionales || data.acompanantes || []);
                }
            }
            setLoading(false);
        });
        return () => unsub();
    }, [id]);

    // ── Subcolecciones ───────────────────────────────────────────────
    useEffect(() => {
        // Viajes
        const unsubViajes = onSnapshot(
            query(collection(db, 'users', id, 'viajes'), orderBy('fecha', 'desc')),
            (snap) => setViajes(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
            () => { } // silenciar error si no existe la subcolección
        );

        // Notificaciones
        const unsubNotifs = onSnapshot(
            query(collection(db, 'users', id, 'notificaciones'), orderBy('fecha', 'desc')),
            (snap) => setNotifs(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
            () => { }
        );

        // Cupones
        const unsubCupones = onSnapshot(
            collection(db, 'users', id, 'cupones'),
            (snap) => setCupones(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
            () => { }
        );

        // Acompañantes (subcolección alternativa)
        const unsubAcomp = onSnapshot(
            collection(db, 'users', id, 'acompanantes'),
            (snap) => {
                if (!snap.empty) setAcompanantes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            },
            () => { }
        );

        // Documentos
        const unsubDocs = onSnapshot(
            collection(db, 'users', id, 'documentos'),
            (snap) => setDocumentos(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
            () => { }
        );

        return () => {
            unsubViajes(); unsubNotifs(); unsubCupones(); unsubAcomp(); unsubDocs();
        };
    }, [id]);

    // ── Nivel badge ──────────────────────────────────────────────────
    const nivelKey = (usuario?.nivel || '').toLowerCase();
    const nivelClass = NIVEL_COLORS[nivelKey] || NIVEL_COLORS.default;
    const puntos = usuario?.puntos ?? usuario?.points ?? 0;
    const iniciales = usuario?.nombre
        ? usuario.nombre.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
        : '?';

    if (loading) return (
        <div className="flex items-center justify-center h-96">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    if (!usuario) return (
        <div className="text-center py-20 text-slate-400">
            <AlertCircle size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-bold">Usuario no encontrado</p>
        </div>
    );

    return (
        <div className="space-y-6 max-w-5xl mx-auto">

            {/* ── Botón volver ── */}
            <button onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors font-bold text-sm">
                <ArrowLeft size={16} /> Volver al directorio
            </button>

            {/* ── Hero del usuario ── */}
            <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-3xl p-6 text-white shadow-xl">
                <div className="flex flex-wrap items-center gap-5">
                    {/* Avatar */}
                    {usuario.foto || usuario.photoURL ? (
                        <img src={usuario.foto || usuario.photoURL} alt={usuario.nombre}
                            className="w-20 h-20 rounded-2xl object-cover border-4 border-white/20 shadow-xl" />
                    ) : (
                        <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center text-3xl font-black">
                            {iniciales}
                        </div>
                    )}

                    {/* Info */}
                    <div className="flex-1">
                        <h1 className="text-2xl font-black tracking-tight">{usuario.nombre || '—'}</h1>
                        <p className="text-blue-200 text-sm">{usuario.correo || usuario.email || '—'}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-3">
                            {/* Puntos */}
                            <div className="flex items-center gap-1.5 bg-white/15 px-3 py-1.5 rounded-xl text-sm font-black">
                                <Star size={14} className="fill-amber-300 text-amber-300" />
                                {Number(puntos).toLocaleString()} pts
                            </div>
                            {/* Nivel */}
                            {usuario.nivel && (
                                <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border ${nivelClass}`}>
                                    {usuario.nivel}
                                </span>
                            )}
                            {/* Próximo nivel */}
                            {usuario.proximoNivel && (
                                <span className="text-blue-200 text-[10px] font-bold">
                                    → próximo: {usuario.proximoNivel}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Stats rápidas */}
                    <div className="flex gap-4 text-center">
                        {[
                            { label: 'Viajes', value: viajes.length },
                            { label: 'Notifs', value: notifs.length },
                            { label: 'Cupones', value: cupones.length },
                            { label: 'Acompañantes', value: acompanantes.length },
                        ].map(s => (
                            <div key={s.label} className="bg-white/10 rounded-2xl px-4 py-3">
                                <p className="text-xl font-black">{s.value}</p>
                                <p className="text-blue-200 text-[10px] font-bold uppercase">{s.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Tabs ── */}
            <div className="flex gap-1 bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100 overflow-x-auto">
                {TABS.map(({ key, label, icon: Icon }) => (
                    <button key={key} onClick={() => setTab(key)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wide transition-all whitespace-nowrap flex-1 justify-center ${tab === key
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'text-slate-500 hover:bg-slate-50'
                            }`}>
                        <Icon size={14} /> {label}
                    </button>
                ))}
            </div>

            {/* ════════════════════════════════════════════════════════
                TAB: PERFIL
            ════════════════════════════════════════════════════════ */}
            {tab === 'perfil' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* Información básica */}
                    <InfoCard title="Información básica" icon={User}>
                        <InfoRow label="Nombre" value={usuario.nombre} />
                        <InfoRow label="Nacimiento" value={fmt(usuario.nacimiento || usuario.fechaNacimiento)} />
                        <InfoRow label="Género" value={usuario.genero || usuario.gender} />
                        <InfoRow label="Miembro desde" value={fmt(usuario.fechaAlta || usuario.createdAt)} />
                    </InfoCard>

                    {/* Datos de contacto */}
                    <InfoCard title="Datos de contacto" icon={Phone}>
                        <InfoRow label="Celular" value={usuario.celular || usuario.telefono || usuario.phone} icon={<Phone size={13} />} />
                        <InfoRow label="Email" value={usuario.correo || usuario.email} icon={<Mail size={13} />} />
                        <InfoRow label="Ciudad" value={usuario.ciudad || usuario.city} icon={<MapPin size={13} />} />
                        <InfoRow label="País" value={usuario.pais || usuario.country} />
                    </InfoCard>

                    {/* Personas adicionales */}
                    <InfoCard title="Personas adicionales" icon={Users}>
                        {acompanantes.length === 0 ? (
                            <p className="text-slate-300 text-sm text-center py-4">Sin acompañantes registrados</p>
                        ) : (
                            <div className="space-y-2">
                                {acompanantes.map((a, i) => (
                                    <div key={i} className="flex items-center gap-3 bg-slate-50 rounded-xl p-3">
                                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-black text-xs">
                                            {(a.nombre || a.name || '?')[0].toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-black text-slate-800 text-sm">{a.nombre || a.name || '—'}</p>
                                            {(a.relacion || a.relationship || a.tipo) && (
                                                <span className="text-[9px] bg-blue-100 text-blue-700 font-black uppercase px-2 py-0.5 rounded">
                                                    {a.relacion || a.relationship || a.tipo}
                                                </span>
                                            )}
                                        </div>
                                        {a.edad && <span className="ml-auto text-xs text-slate-400">{a.edad} años</span>}
                                    </div>
                                ))}
                            </div>
                        )}
                    </InfoCard>

                    {/* Documentos */}
                    <InfoCard title="Documentos" icon={FileText}>
                        {documentos.length === 0 ? (
                            <p className="text-slate-300 text-sm text-center py-4">Sin documentos registrados</p>
                        ) : (
                            <div className="space-y-2">
                                {documentos.map((d, i) => (
                                    <div key={i} className="flex items-center justify-between bg-slate-50 rounded-xl p-3">
                                        <div>
                                            <p className="font-bold text-slate-700 text-sm">{d.tipo || d.type || 'Documento'}</p>
                                            <p className="text-xs text-slate-400">{d.numero || d.number || '—'}</p>
                                        </div>
                                        <div className="text-right text-xs text-slate-400">
                                            <p>Vence: {fmt(d.vencimiento || d.expiration)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </InfoCard>

                    {/* Lealtad */}
                    <InfoCard title="Lealtad" icon={Heart}>
                        <div className="flex items-center justify-between p-3 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl border border-amber-100">
                            <div>
                                <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Puntos acumulados</p>
                                <p className="text-3xl font-black text-amber-700">{Number(puntos).toLocaleString()}</p>
                            </div>
                            <Star size={40} className="fill-amber-300 text-amber-300 opacity-50" />
                        </div>
                        {usuario.nivel && (
                            <div className="mt-3 flex items-center justify-between text-sm">
                                <span className="text-slate-500 font-bold">Nivel actual</span>
                                <span className={`font-black uppercase text-xs px-3 py-1 rounded-full border ${nivelClass}`}>{usuario.nivel}</span>
                            </div>
                        )}
                        {usuario.puntosParaSubir && (
                            <p className="text-xs text-slate-400 mt-2 text-center">
                                Faltan <strong>{usuario.puntosParaSubir}</strong> pts para el siguiente nivel
                            </p>
                        )}
                    </InfoCard>

                    {/* Preferencias */}
                    <InfoCard title="Preferencias" icon={Heart}>
                        {!(usuario.preferencias || usuario.preferences) ? (
                            <p className="text-slate-300 text-sm text-center py-4">Sin preferencias registradas</p>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {Object.entries(usuario.preferencias || usuario.preferences || {}).map(([k, v]) => (
                                    <span key={k} className="bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1.5 rounded-full border border-blue-100">
                                        {k}: {String(v)}
                                    </span>
                                ))}
                            </div>
                        )}
                    </InfoCard>

                </div>
            )}

            {/* ════════════════════════════════════════════════════════
                TAB: VIAJES
            ════════════════════════════════════════════════════════ */}
            {tab === 'viajes' && (
                <div className="space-y-3">
                    {viajes.length === 0 ? (
                        <EmptyState icon={Plane} mensaje="Este cliente no tiene viajes registrados" />
                    ) : (
                        viajes.map(v => (
                            <div key={v.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-wrap items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                                    <Plane size={18} className="text-blue-500" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-black text-slate-800">{v.destino || v.destination || v.nombre || 'Viaje'}</p>
                                    <p className="text-xs text-slate-400">{fmt(v.fecha || v.fechaViaje || v.date)}</p>
                                </div>
                                {(v.estado || v.status) && (
                                    <span className={`text-[10px] font-black uppercase px-3 py-1.5 rounded-full border ${(v.estado || v.status) === 'completado' ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                            : (v.estado || v.status) === 'pendiente' ? 'bg-amber-50 text-amber-700 border-amber-200'
                                                : 'bg-slate-50 text-slate-600 border-slate-200'
                                        }`}>
                                        {v.estado || v.status}
                                    </span>
                                )}
                                {v.puntos && (
                                    <div className="flex items-center gap-1 text-amber-600 font-black text-sm">
                                        <Star size={13} className="fill-amber-400" /> +{v.puntos}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* ════════════════════════════════════════════════════════
                TAB: NOTIFICACIONES
            ════════════════════════════════════════════════════════ */}
            {tab === 'notificaciones' && (
                <div className="space-y-3">
                    {notifs.length === 0 ? (
                        <EmptyState icon={Bell} mensaje="Sin notificaciones registradas" />
                    ) : (
                        notifs.map(n => (
                            <div key={n.id} className={`bg-white rounded-2xl border shadow-sm p-4 flex gap-4 ${n.leida || n.read ? 'border-slate-100 opacity-70' : 'border-blue-100'}`}>
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${n.leida || n.read ? 'bg-slate-50' : 'bg-blue-50'}`}>
                                    {n.leida || n.read
                                        ? <CheckCircle size={18} className="text-slate-300" />
                                        : <Bell size={18} className="text-blue-500" />}
                                </div>
                                <div className="flex-1">
                                    <p className="font-bold text-slate-800 text-sm">{n.titulo || n.title || 'Notificación'}</p>
                                    {(n.mensaje || n.body || n.message) && (
                                        <p className="text-xs text-slate-500 mt-0.5">{n.mensaje || n.body || n.message}</p>
                                    )}
                                </div>
                                <div className="text-right flex-shrink-0">
                                    <p className="text-[10px] text-slate-400">{fmt(n.fecha || n.createdAt)}</p>
                                    {!(n.leida || n.read) && (
                                        <span className="inline-block w-2 h-2 rounded-full bg-blue-500 mt-1" />
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* ════════════════════════════════════════════════════════
                TAB: CUPONES
            ════════════════════════════════════════════════════════ */}
            {tab === 'cupones' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {cupones.length === 0 ? (
                        <div className="col-span-2">
                            <EmptyState icon={Gift} mensaje="Este cliente no tiene cupones" />
                        </div>
                    ) : (
                        cupones.map(c => (
                            <div key={c.id} className={`rounded-2xl border-2 border-dashed p-5 ${c.usado || c.used ? 'border-slate-100 bg-slate-50 opacity-60' : 'border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50'}`}>
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="font-black text-slate-800">{c.nombre || c.name || c.codigo || 'Cupón'}</p>
                                        {(c.descripcion || c.description) && (
                                            <p className="text-xs text-slate-500 mt-1">{c.descripcion || c.description}</p>
                                        )}
                                    </div>
                                    <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-full border ${c.usado || c.used ? 'bg-slate-100 text-slate-400 border-slate-200' : 'bg-blue-100 text-blue-700 border-blue-200'}`}>
                                        {c.usado || c.used ? 'Usado' : 'Activo'}
                                    </span>
                                </div>
                                <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                                    {c.codigo && <code className="bg-white border px-2 py-1 rounded font-mono font-bold text-slate-600">{c.codigo}</code>}
                                    <span>Vence: {fmt(c.vencimiento || c.expiration || c.fechaVencimiento)}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

        </div>
    );
}

// ── Componentes auxiliares ───────────────────────────────────────────
function InfoCard({ title, icon: Icon, children }) {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-50">
                <Icon size={15} className="text-blue-500" />
                <h3 className="font-black text-slate-700 text-xs uppercase tracking-widest">{title}</h3>
            </div>
            <div className="p-5 space-y-3">{children}</div>
        </div>
    );
}

function InfoRow({ label, value, icon }) {
    return (
        <div className="flex items-start justify-between gap-4">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1 flex-shrink-0">
                {icon} {label}
            </span>
            <span className="text-sm font-semibold text-slate-700 text-right">{value || '—'}</span>
        </div>
    );
}

function EmptyState({ icon: Icon, mensaje }) {
    return (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-16 text-center">
            <Icon size={36} className="mx-auto mb-3 text-slate-200" />
            <p className="text-slate-400 text-sm font-semibold">{mensaje}</p>
        </div>
    );
}
