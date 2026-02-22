import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebaseConfig';
import {
    collection,
    onSnapshot,
    doc,
    updateDoc,
    addDoc,
    serverTimestamp
} from 'firebase/firestore';
import { User, MoreHorizontal, Clock, Ticket, Globe } from 'lucide-react';

const ETAPAS = ["Prospecto", "Cotizando", "Esperando Pago", "Confirmado", "En Viaje", "Post-Venta"];

const ETAPA_COLORS = {
    "Prospecto": "bg-slate-100 text-slate-500",
    "Cotizando": "bg-blue-100 text-blue-600",
    "Esperando Pago": "bg-amber-100 text-amber-600",
    "Confirmado": "bg-emerald-100 text-emerald-600",
    "En Viaje": "bg-indigo-100 text-indigo-600",
    "Post-Venta": "bg-purple-100 text-purple-600",
};

const formatFecha = (fecha) => {
    if (!fecha) return 'Reciente';
    if (fecha?.toDate) return fecha.toDate().toLocaleDateString('es-MX');
    if (typeof fecha === 'string') return fecha.slice(0, 10);
    return 'Reciente';
};

export default function KanbanProspectos() {
    const navigate = useNavigate();
    const [clientes, setClientes] = useState([]);
    const [draggingId, setDraggingId] = useState(null);
    const [overColumn, setOverColumn] = useState(null);

    // 1. ESCUCHA DE CLIENTES EN EL CRM
    useEffect(() => {
        const unsub = onSnapshot(collection(db, "clientes"), (snap) => {
            setClientes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        return () => unsub();
    }, []);

    // 2. SINCRONIZACIÓN AUTOMÁTICA DESDE EL SITIO WEB (Opción A)
    useEffect(() => {
        const unsubWeb = onSnapshot(collection(db, "usuarios_web"), (snap) => {
            snap.docChanges().forEach(async (change) => {
                if (change.type === "added") {
                    const nuevoUserWeb = change.doc.data();

                    // Evitar duplicados por correo
                    const existe = clientes.find(c => c.correo === nuevoUserWeb.email);

                    if (!existe && nuevoUserWeb.email) {
                        try {
                            await addDoc(collection(db, "clientes"), {
                                nombre: nuevoUserWeb.nombre || "Usuario Web",
                                correo: nuevoUserWeb.email,
                                telefono: nuevoUserWeb.telefono || "Sin registrar",
                                etapa: "Prospecto",
                                puntos: 100, // Bono por registro
                                origen: "Sitio Web",
                                fechaAlta: serverTimestamp()
                            });
                            console.log("Nuevo prospecto jalado desde la web:", nuevoUserWeb.email);
                        } catch (err) {
                            console.error("Error al sincronizar usuario web:", err);
                        }
                    }
                }
            });
        });
        return () => unsubWeb();
    }, [clientes]); // Dependencia de clientes para la verificación de duplicados

    const handleDragStart = (e, id) => {
        e.dataTransfer.setData('clienteId', id);
        setDraggingId(id);
    };

    const handleDrop = async (e, nuevaEtapa) => {
        e.preventDefault();
        const id = e.dataTransfer.getData('clienteId');
        setOverColumn(null);
        setDraggingId(null);
        try {
            await updateDoc(doc(db, "clientes", id), { etapa: nuevaEtapa });
        } catch (err) { console.error(err); }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-black text-gray-800 uppercase tracking-tighter flex items-center gap-2">
                        Pipeline de Ventas <Globe className="text-blue-500 animate-pulse" size={20} />
                    </h2>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Sincronizado con evelux.org</p>
                </div>
                <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-4 py-2 rounded-xl border border-blue-100 uppercase">
                    {clientes.length} Leads Activos
                </span>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-6 custom-scrollbar" style={{ minHeight: '75vh' }}>
                {ETAPAS.map(etapa => (
                    <div
                        key={etapa}
                        className={`min-w-[300px] rounded-[2.5rem] p-5 border-2 transition-all ${overColumn === etapa ? 'bg-blue-50/50 border-blue-200 shadow-inner' : 'bg-slate-50/50 border-transparent'}`}
                        onDragOver={(e) => { e.preventDefault(); setOverColumn(etapa); }}
                        onDragLeave={() => setOverColumn(null)}
                        onDrop={(e) => handleDrop(e, etapa)}
                    >
                        <div className="flex justify-between items-center mb-6 px-2">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{etapa}</span>
                            <span className={`text-[10px] font-black px-3 py-1 rounded-full ${ETAPA_COLORS[etapa]}`}>
                                {clientes.filter(c => (c.etapa || "Prospecto") === etapa).length}
                            </span>
                        </div>

                        <div className="space-y-4">
                            {clientes
                                .filter(c => (c.etapa || "Prospecto") === etapa)
                                .map(item => (
                                    <div
                                        key={item.id}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, item.id)}
                                        className={`bg-white p-5 rounded-3xl shadow-sm border border-slate-100 hover:shadow-xl hover:border-blue-200 transition-all cursor-grab active:cursor-grabbing ${draggingId === item.id ? 'opacity-20 scale-95' : 'opacity-100'}`}
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="w-10 h-10 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-blue-600">
                                                <User size={18} />
                                            </div>
                                            {item.origen === "Sitio Web" && (
                                                <span className="bg-blue-600 text-white p-1 rounded-lg" title="Registro desde Web">
                                                    <Globe size={10} />
                                                </span>
                                            )}
                                        </div>

                                        <p className="font-black text-slate-700 text-xs mb-1 uppercase tracking-tight truncate">{item.nombre}</p>
                                        <p className="text-[10px] text-slate-400 font-bold truncate mb-4">{item.correo}</p>

                                        <div className="flex justify-between items-center border-t pt-4 border-slate-50">
                                            <div className="flex items-center gap-1 text-[9px] font-black text-slate-300 uppercase">
                                                <Clock size={10} /> {formatFecha(item.fechaAlta)}
                                            </div>
                                            <div className="flex gap-2">
                                                {["Confirmado", "En Viaje", "Post-Venta"].includes(item.etapa) && (
                                                    <button
                                                        onClick={() => navigate(`/operacion/voucher/${item.id}`)}
                                                        className="bg-slate-900 text-white p-2 rounded-xl hover:bg-blue-600 transition-all shadow-lg shadow-slate-100"
                                                    >
                                                        <Ticket size={12} />
                                                    </button>
                                                )}
                                                <div className={`w-2 h-2 rounded-full mt-1 ${item.puntos > 500 ? 'bg-emerald-500 animate-pulse' : 'bg-slate-200'}`} title={`Puntos: ${item.puntos || 0}`}></div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>

                ))}
                <div className="flex items-center gap-2">
                    {item.isOnline ? (
                        <span className="flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                    ) : (
                        <span className="h-2 w-2 rounded-full bg-slate-200"></span>
                    )}
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">
                        {item.isOnline ? 'Navegando ahora' : 'Desconectado'}
                    </p>
                </div>
            </div>
        </div>
    );
}