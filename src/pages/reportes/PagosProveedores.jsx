import { useEffect, useState } from 'react';
import { db } from '../../firebaseConfig';
// AGREGAR orderBy AQUÍ:
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { Wallet, Building2, AlertTriangle } from 'lucide-react';

export default function PagosProveedores() {
    const [pagosPendientes, setPagosPendientes] = useState([]);
    const [resumen, setResumen] = useState({ totalPendiente: 0 });

    useEffect(() => {
        // Ahora orderBy funcionará correctamente
        const q = query(collection(db, "reservas"), orderBy("fechaInicio", "asc"));

        const unsub = onSnapshot(q, (snap) => {
            const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setPagosPendientes(data);

            const pendiente = data.reduce((acc, r) => acc + (Number(r.montoTotal) * 0.8), 0);
            setResumen({ totalPendiente: pendiente });
        });
        return () => unsub();
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
                <div>
                    <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter">
                        Liquidaciones B2B <Wallet className="inline-block ml-2 text-emerald-500" size={24} />
                    </h2>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Control de egresos y pagos a operadores</p>
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase">Total por Liquidar</p>
                    <p className="text-2xl font-black text-red-500">${resumen.totalPendiente.toLocaleString()} MXN</p>
                </div>
            </div>

            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b text-slate-400 font-bold text-[10px] uppercase">
                        <tr>
                            <th className="p-5">Proveedor / Operadora</th>
                            <th className="p-5">Reserva Ref.</th>
                            <th className="p-5">Fecha Salida</th>
                            <th className="p-5 text-right">Costo Neto</th>
                            <th className="p-5 text-center">Estatus Pago</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {pagosPendientes.map(p => (
                            <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="p-5 font-bold text-slate-700 uppercase">
                                    {p.empresaNombre || p.empresaId || 'Sin asignar'}
                                </td>
                                <td className="p-5">
                                    <div className="font-black text-blue-600">{p.folio}</div>
                                    <div className="text-[10px] text-slate-400 uppercase">{p.paxTitular}</div>
                                </td>
                                <td className="p-5 text-slate-600 italic">{p.fechaInicio}</td>
                                <td className="p-5 text-right font-black text-slate-800">
                                    ${(Number(p.montoTotal) * 0.8).toLocaleString()}
                                </td>
                                <td className="p-5 text-center">
                                    <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-[9px] font-black uppercase flex items-center justify-center gap-1">
                                        <AlertTriangle size={10} /> Pendiente
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}