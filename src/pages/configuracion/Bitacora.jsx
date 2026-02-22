import { useEffect, useState } from 'react';
import { db } from '../../firebaseConfig';
import { collection, onSnapshot, addDoc, query, orderBy } from 'firebase/firestore';
import { ClipboardList, PlusCircle, Trash2, Edit, Eye } from 'lucide-react';

// ─── Helper: registrar un evento en la bitácora ─────────────────────────────
export const registrarLog = async (accion, modulo, detalle, tipo = 'INFO') => {
    try {
        await addDoc(collection(db, "logs"), {
            usuario: "José Manuel Carreiro", // Aquí irá el usuario logueado dinámicamente
            accion,
            modulo,
            detalle,
            tipo,
            fecha: new Date().toLocaleString('es-MX')
        });
    } catch (err) {
        console.error("Error al registrar log:", err);
    }
};

// ─── Íconos según tipo de acción ────────────────────────────────────────────
const TipoIcon = ({ tipo }) => {
    const map = {
        CREAR: <PlusCircle size={14} className="text-emerald-500" />,
        EDITAR: <Edit size={14} className="text-amber-500" />,
        ELIMINAR: <Trash2 size={14} className="text-red-500" />,
        VER: <Eye size={14} className="text-blue-500" />,
        INFO: <ClipboardList size={14} className="text-slate-400" />,
    };
    return map[tipo] || map['INFO'];
};

const badgeColor = {
    CREAR: 'bg-emerald-50 text-emerald-700',
    EDITAR: 'bg-amber-50 text-amber-700',
    ELIMINAR: 'bg-red-50 text-red-700',
    VER: 'bg-blue-50 text-blue-700',
    INFO: 'bg-slate-100 text-slate-500',
};

// ─── Componente Principal ────────────────────────────────────────────────────
export default function Bitacora() {
    const [logs, setLogs] = useState([]);

    useEffect(() => {
        const q = query(collection(db, "logs"), orderBy("fecha", "desc"));
        const unsub = onSnapshot(q, (snap) => {
            setLogs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => unsub();
    }, []);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div>
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        Bitácora de Actividad <ClipboardList className="text-blue-600" size={20} />
                    </h2>
                    <p className="text-xs text-gray-500 font-medium">Historial de acciones realizadas en el sistema</p>
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase bg-slate-50 px-3 py-2 rounded-lg">
                    {logs.length} eventos registrados
                </span>
            </div>

            {/* Tabla de Logs */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="bg-slate-50 border-b border-gray-200 text-slate-500 text-[10px] font-black uppercase tracking-widest">
                            <th className="p-4">Fecha / Hora</th>
                            <th className="p-4">Usuario</th>
                            <th className="p-4">Módulo</th>
                            <th className="p-4">Acción</th>
                            <th className="p-4">Detalle</th>
                            <th className="p-4 text-center">Tipo</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {logs.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="p-10 text-center text-slate-400 italic text-sm">
                                    No hay eventos registrados aún.
                                </td>
                            </tr>
                        ) : (
                            logs.map((log) => (
                                <tr key={log.id} className="hover:bg-blue-50/30 transition-colors">
                                    <td className="p-4 text-gray-400 font-medium text-[11px] whitespace-nowrap">{log.fecha}</td>
                                    <td className="p-4 font-bold text-slate-700 text-xs">{log.usuario}</td>
                                    <td className="p-4">
                                        <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-lg text-[10px] font-black uppercase">
                                            {log.modulo}
                                        </span>
                                    </td>
                                    <td className="p-4 font-semibold text-slate-600 text-xs">{log.accion}</td>
                                    <td className="p-4 text-slate-400 italic text-[11px] max-w-xs truncate">{log.detalle}</td>
                                    <td className="p-4 text-center">
                                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black uppercase ${badgeColor[log.tipo] || badgeColor['INFO']}`}>
                                            <TipoIcon tipo={log.tipo} />
                                            {log.tipo}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}