import { useEffect, useState } from 'react';
import { db } from '../../../firebaseConfig';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { Calendar, Filter, User, Building2, Search, Clock, Wallet } from 'lucide-react';

export default function LimiteCliente() {
    const [reservas, setReservas] = useState([]);
    const [clientes, setClientes] = useState([]);
    const [empresas, setEmpresas] = useState([]);
    const [usuarios, setUsuarios] = useState([]);

    const [filtro, setFiltro] = useState({
        fechaLimite: '',
        clienteId: '',
        proveedorId: '',
        vendedorId: '',
        moneda: ''
    });

    useEffect(() => {
        // Cargar Catálogos para los Filtros
        onSnapshot(collection(db, "clientes"), (snap) => setClientes(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
        onSnapshot(collection(db, "empresas"), (snap) => setEmpresas(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
        onSnapshot(collection(db, "empleados"), (snap) => setUsuarios(snap.docs.map(d => ({ id: d.id, ...d.data() }))));

        const q = query(collection(db, "reservas"), orderBy("fechaLimite", "asc"));
        const unsub = onSnapshot(q, (snap) => {
            setReservas(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => unsub();
    }, []);

    // Lógica de filtrado
    const reservasFiltradas = reservas.filter(r => {
        return (
            (filtro.clienteId === '' || r.clienteId === filtro.clienteId) &&
            (filtro.fechaLimite === '' || r.fechaLimite === filtro.fechaLimite) &&
            (filtro.proveedorId === '' || r.empresaId === filtro.proveedorId) &&
            (filtro.moneda === '' || r.moneda === filtro.moneda)
        );
    });

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter flex items-center gap-2">
                Límite pago de Cliente <Clock className="text-blue-600 animate-pulse" size={24} />
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* PANEL DE FILTROS - DISEÑO RESERVANTIA */}
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4 h-fit sticky top-8">
                    <div className="flex items-center gap-2 text-white bg-blue-600 p-2 rounded-lg font-bold text-xs uppercase mb-4">
                        <Filter size={14} /> Filtrar
                    </div>

                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Fecha Límite</label>
                        <input type="date" className="w-full p-2 bg-slate-50 border rounded-xl text-sm"
                            onChange={e => setFiltro({ ...filtro, fechaLimite: e.target.value })} />
                    </div>

                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Cliente</label>
                        <select className="w-full p-2 bg-slate-50 border rounded-xl text-sm outline-none"
                            onChange={e => setFiltro({ ...filtro, clienteId: e.target.value })}>
                            <option value="">Cualquiera</option>
                            {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Proveedor</label>
                        <select className="w-full p-2 bg-slate-50 border rounded-xl text-sm outline-none"
                            onChange={e => setFiltro({ ...filtro, proveedorId: e.target.value })}>
                            <option value="">Cualquiera</option>
                            {empresas.map(e => <option key={e.id} value={e.id}>{e.nombreComercial}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Moneda</label>
                        <select className="w-full p-2 bg-slate-50 border rounded-xl text-sm outline-none"
                            onChange={e => setFiltro({ ...filtro, moneda: e.target.value })}>
                            <option value="">Todas</option>
                            <option value="MXN">MXN</option>
                            <option value="USD">USD</option>
                        </select>
                    </div>

                    <div className="flex gap-2 pt-4">
                        <button className="flex-1 bg-blue-600 text-white font-bold py-2 rounded-xl text-xs hover:shadow-lg transition-all">Aplicar</button>
                        <button onClick={() => setFiltro({ fechaLimite: '', clienteId: '', proveedorId: '', vendedorId: '', moneda: '' })}
                            className="flex-1 bg-red-500 text-white font-bold py-2 rounded-xl text-xs">Quitar Filtros</button>
                    </div>
                </div>

                {/* TABLA DE RESULTADOS */}
                <div className="lg:col-span-3 bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b text-slate-400 font-bold text-[10px] uppercase">
                            <tr>
                                <th className="p-5">Reserva / Titular</th>
                                <th className="p-5">Vencimiento</th>
                                <th className="p-5">Socio / Destino</th>
                                <th className="p-5 text-right">Saldo</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {reservasFiltradas.map(r => (
                                <tr key={r.id} className="hover:bg-blue-50/50 transition-colors">
                                    <td className="p-5">
                                        <div className="font-black text-blue-700">{r.folio}</div>
                                        <div className="text-slate-500 font-medium text-xs uppercase">{r.paxTitular}</div>
                                    </td>
                                    <td className="p-5">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${new Date(r.fechaLimite) < new Date() ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
                                            {r.fechaLimite}
                                        </span>
                                    </td>
                                    <td className="p-5">
                                        <div className="font-bold text-slate-700 uppercase text-xs">{r.hotelNombre}</div>
                                        <div className="text-[10px] text-slate-400">{r.destinoNombre}</div>
                                    </td>
                                    <td className="p-5 text-right font-black text-slate-800">
                                        ${Number(r.montoTotal).toLocaleString()} <span className="text-[10px] text-slate-400">{r.moneda}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}