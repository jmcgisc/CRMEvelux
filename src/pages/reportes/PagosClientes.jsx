import { useEffect, useState } from 'react';
import { db } from '../../firebaseConfig';
import { collection, onSnapshot, query, orderBy, addDoc, doc, updateDoc } from 'firebase/firestore';
import {
    CreditCard, Search, Plus, CheckCircle, Clock, AlertCircle,
    TrendingUp, DollarSign, X, Banknote
} from 'lucide-react';

const METODOS = ['Transferencia', 'Tarjeta Crédito', 'Tarjeta Débito', 'Efectivo', 'Cheque', 'Depósito'];

const ESTATUS_CFG = {
    pagado: { label: 'Pagado', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle },
    parcial: { label: 'Parcial', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock },
    pendiente: { label: 'Pendiente', color: 'bg-red-50 text-red-700 border-red-200', icon: AlertCircle },
};

const fmt = (f) => {
    if (!f) return '—';
    if (f?.toDate) return f.toDate().toLocaleDateString('es-MX');
    return f;
};

export default function PagosClientes() {
    const [pagos, setPagos] = useState([]);
    const [busqueda, setBusqueda] = useState('');
    const [filtroEst, setFiltroEst] = useState('todos');
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(true);

    const [nuevoPago, setNuevoPago] = useState({
        cliente: '', folio: '', concepto: '', monto: '', moneda: 'MXN',
        metodoPago: 'Transferencia', referencia: '', fecha: new Date().toISOString().split('T')[0],
        estatus: 'pagado', notas: ''
    });
    const set = (k, v) => setNuevoPago(p => ({ ...p, [k]: v }));

    useEffect(() => {
        const q = query(collection(db, 'pagos_clientes'), orderBy('fecha', 'desc'));
        const unsub = onSnapshot(q, snap => {
            setPagos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            setLoading(false);
        });
        return () => unsub();
    }, []);

    const guardar = async (e) => {
        e.preventDefault();
        try {
            await addDoc(collection(db, 'pagos_clientes'), {
                ...nuevoPago,
                monto: parseFloat(nuevoPago.monto),
                fechaRegistro: new Date(),
            });
            setShowModal(false);
            setNuevoPago({ cliente: '', folio: '', concepto: '', monto: '', moneda: 'MXN', metodoPago: 'Transferencia', referencia: '', fecha: new Date().toISOString().split('T')[0], estatus: 'pagado', notas: '' });
        } catch (err) { console.error(err); }
    };

    // ── Filtros ───────────────────────────────────────────────────────
    const filtrados = pagos.filter(p => {
        const txt = `${p.cliente} ${p.folio} ${p.referencia}`.toLowerCase();
        const matchBusq = txt.includes(busqueda.toLowerCase());
        if (filtroEst === 'todos') return matchBusq;
        return matchBusq && p.estatus === filtroEst;
    });

    // ── Métricas ──────────────────────────────────────────────────────
    const totalCobrado = filtrados.filter(p => p.estatus === 'pagado').reduce((a, p) => a + Number(p.monto || 0), 0);
    const totalParcial = filtrados.filter(p => p.estatus === 'parcial').reduce((a, p) => a + Number(p.monto || 0), 0);
    const totalPendiente = filtrados.filter(p => p.estatus === 'pendiente').reduce((a, p) => a + Number(p.monto || 0), 0);
    const totalGeneral = filtrados.reduce((a, p) => a + Number(p.monto || 0), 0);

    return (
        <div className="space-y-6">

            {/* ── Header ── */}
            <div className="flex flex-wrap justify-between items-end gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <div>
                    <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter flex items-center gap-2">
                        Pagos de Clientes <CreditCard className="text-emerald-600" size={24} />
                    </h2>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">
                        Registro y control de cobros · Tiempo real
                    </p>
                </div>
                <button onClick={() => setShowModal(true)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-lg font-bold text-sm transition-all">
                    <Plus size={18} /> Registrar Pago
                </button>
            </div>

            {/* ── KPIs ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total cobrado', value: `$${totalCobrado.toLocaleString()}`, color: 'emerald', icon: CheckCircle },
                    { label: 'Parcial', value: `$${totalParcial.toLocaleString()}`, color: 'amber', icon: Clock },
                    { label: 'Pendiente', value: `$${totalPendiente.toLocaleString()}`, color: 'red', icon: AlertCircle },
                    { label: 'Total general', value: `$${totalGeneral.toLocaleString()}`, color: 'blue', icon: TrendingUp },
                ].map(({ label, value, color, icon: Icon }) => (
                    <div key={label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                        <div className={`w-9 h-9 rounded-xl bg-${color}-50 flex items-center justify-center mb-3`}>
                            <Icon size={18} className={`text-${color}-500`} />
                        </div>
                        <p className="text-xl font-black text-slate-800">{value}</p>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{label}</p>
                    </div>
                ))}
            </div>

            {/* ── Barra de herramientas ── */}
            <div className="flex flex-wrap justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm gap-3">
                <div className="flex gap-2 flex-wrap">
                    {['todos', 'pagado', 'parcial', 'pendiente'].map(est => (
                        <button key={est} onClick={() => setFiltroEst(est)}
                            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wide border-2 transition-all ${filtroEst === est
                                    ? est === 'todos' ? 'bg-slate-800 text-white border-slate-800'
                                        : est === 'pagado' ? 'bg-emerald-600 text-white border-emerald-600'
                                            : est === 'parcial' ? 'bg-amber-500 text-white border-amber-500'
                                                : 'bg-red-500 text-white border-red-500'
                                    : 'bg-white text-slate-500 border-slate-100 hover:border-slate-300'
                                }`}>
                            {est === 'todos' ? `Todos (${pagos.length})` : (ESTATUS_CFG[est]?.label + ` (${pagos.filter(p => p.estatus === est).length})`)}
                        </button>
                    ))}
                </div>
                <div className="relative w-64">
                    <Search className="absolute left-3 top-2.5 text-slate-300" size={15} />
                    <input type="text" placeholder="Buscar cliente, folio, referencia..."
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-400"
                        onChange={e => setBusqueda(e.target.value)} />
                </div>
            </div>

            {/* ── Tabla ── */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-x-auto">
                <table className="w-full text-left text-[11px] min-w-[900px]">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-black uppercase tracking-widest">
                            <th className="p-4">Fecha</th>
                            <th className="p-4">Cliente</th>
                            <th className="p-4">Folio</th>
                            <th className="p-4">Concepto</th>
                            <th className="p-4">Método</th>
                            <th className="p-4">Referencia</th>
                            <th className="p-4 text-center">Estatus</th>
                            <th className="p-4 text-right">Monto</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {filtrados.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="p-16 text-center text-slate-300 font-bold">
                                    {loading ? 'Cargando...' : 'No hay pagos registrados'}
                                </td>
                            </tr>
                        ) : filtrados.map(p => {
                            const est = ESTATUS_CFG[p.estatus] || ESTATUS_CFG.pendiente;
                            const EstIcon = est.icon;
                            return (
                                <tr key={p.id} className="hover:bg-emerald-50/20 transition-colors">
                                    <td className="p-4 text-slate-500 font-medium">{fmt(p.fecha)}</td>
                                    <td className="p-4 font-black text-slate-800 uppercase">{p.cliente}</td>
                                    <td className="p-4 font-bold text-blue-600">{p.folio || '—'}</td>
                                    <td className="p-4 text-slate-600">{p.concepto || '—'}</td>
                                    <td className="p-4">
                                        <span className="flex items-center gap-1 text-slate-500 font-medium">
                                            <Banknote size={12} /> {p.metodoPago}
                                        </span>
                                    </td>
                                    <td className="p-4 font-mono text-slate-400 text-[10px]">{p.referencia || '—'}</td>
                                    <td className="p-4 text-center">
                                        <span className={`inline-flex items-center gap-1 text-[9px] font-black uppercase px-2.5 py-1 rounded-full border ${est.color}`}>
                                            <EstIcon size={10} /> {est.label}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right font-black text-slate-800">
                                        ${Number(p.monto || 0).toLocaleString()} <span className="text-[9px] text-slate-400">{p.moneda}</span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                    <tfoot className="bg-slate-50 border-t-2 border-slate-100 font-black text-slate-700">
                        <tr>
                            <td colSpan={7} className="p-4 text-right text-xs uppercase tracking-widest">Total en vista:</td>
                            <td className="p-4 text-right text-sm">${totalGeneral.toLocaleString()} <span className="text-[9px] font-normal text-slate-400">MXN</span></td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            <p className="text-center text-[10px] font-black text-slate-300 uppercase tracking-widest">
                {filtrados.length} registros · Evelux CRM · Stratik Cloud
            </p>

            {/* ══════════ MODAL NUEVO PAGO ══════════ */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] overflow-y-auto">
                        <div className="bg-emerald-600 p-5 text-white flex justify-between items-center">
                            <div>
                                <h3 className="font-black uppercase tracking-tight text-sm">Registrar Pago</h3>
                                <p className="text-emerald-200 text-[10px] mt-0.5">Nuevo cobro de cliente</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="hover:rotate-90 transition-transform text-xl">✕</button>
                        </div>

                        <form onSubmit={guardar} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="lbl">Cliente / Titular</label>
                                    <input required type="text" placeholder="Nombre del cliente"
                                        className="inp" value={nuevoPago.cliente}
                                        onChange={e => set('cliente', e.target.value)} />
                                </div>
                                <div>
                                    <label className="lbl">Folio de reserva</label>
                                    <input type="text" placeholder="Ej. EVX-0001" className="inp"
                                        value={nuevoPago.folio} onChange={e => set('folio', e.target.value)} />
                                </div>
                                <div>
                                    <label className="lbl">Fecha de pago</label>
                                    <input required type="date" className="inp" value={nuevoPago.fecha}
                                        onChange={e => set('fecha', e.target.value)} />
                                </div>
                                <div className="col-span-2">
                                    <label className="lbl">Concepto</label>
                                    <input required type="text" placeholder="Ej. Pago total reserva Cancún"
                                        className="inp" value={nuevoPago.concepto}
                                        onChange={e => set('concepto', e.target.value)} />
                                </div>
                                <div>
                                    <label className="lbl">Monto</label>
                                    <input required type="number" min="0" step="0.01" placeholder="0.00"
                                        className="inp" value={nuevoPago.monto}
                                        onChange={e => set('monto', e.target.value)} />
                                </div>
                                <div>
                                    <label className="lbl">Moneda</label>
                                    <select className="inp" value={nuevoPago.moneda} onChange={e => set('moneda', e.target.value)}>
                                        <option>MXN</option>
                                        <option>USD</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="lbl">Método de pago</label>
                                    <select className="inp" value={nuevoPago.metodoPago} onChange={e => set('metodoPago', e.target.value)}>
                                        {METODOS.map(m => <option key={m}>{m}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="lbl">Referencia / Comprobante</label>
                                    <input type="text" placeholder="Núm. de transacción" className="inp"
                                        value={nuevoPago.referencia} onChange={e => set('referencia', e.target.value)} />
                                </div>
                                <div>
                                    <label className="lbl">Estatus del pago</label>
                                    <select className="inp" value={nuevoPago.estatus} onChange={e => set('estatus', e.target.value)}>
                                        <option value="pagado">Pagado completo</option>
                                        <option value="parcial">Pago parcial</option>
                                        <option value="pendiente">Pendiente</option>
                                    </select>
                                </div>
                                <div className="col-span-2">
                                    <label className="lbl">Notas (opcional)</label>
                                    <textarea rows={2} placeholder="Observaciones adicionales..."
                                        className="inp resize-none" value={nuevoPago.notas}
                                        onChange={e => set('notas', e.target.value)} />
                                </div>
                            </div>
                            <button type="submit"
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3.5 rounded-2xl transition-all shadow-xl shadow-emerald-100 uppercase tracking-widest text-xs">
                                Guardar Pago
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Estilos inline reutilizables */}
            <style>{`
                .lbl { display: block; font-size: 9px; font-weight: 900; color: #94a3b8; text-transform: uppercase; letter-spacing: .1em; margin-bottom: 4px; }
                .inp { width: 100%; border: 2px solid #f1f5f9; border-radius: 12px; padding: 10px 12px; font-size: 13px; outline: none; transition: border-color .2s; }
                .inp:focus { border-color: #10b981; }
            `}</style>
        </div>
    );
}
