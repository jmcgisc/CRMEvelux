import { useEffect, useState } from 'react';
import { db } from '../firebaseConfig';
import { collection, onSnapshot, addDoc, query, orderBy, getDocs } from 'firebase/firestore';
import { Lock, Plus, Users, Landmark, Calendar } from 'lucide-react';

export default function Bloqueos() {
    const [bloqueos, setBloqueos] = useState([]);
    const [empresas, setEmpresas] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [nuevoBloqueo, setNuevoBloqueo] = useState({
        empresaId: '',
        nombreViaje: '',
        totalLugares: 0,
        lugaresVendidos: 0,
        fechaSalida: '',
        costoUnitario: 0
    });

    useEffect(() => {
        // Escuchar bloqueos en tiempo real
        const q = query(collection(db, "bloqueos"), orderBy("fechaSalida", "asc"));
        const unsub = onSnapshot(q, (snap) => {
            setBloqueos(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        // Cargar empresas para vincular el bloqueo
        getDocs(collection(db, "empresas")).then(snap => {
            setEmpresas(snap.docs.map(doc => ({ id: doc.id, nombre: doc.data().nombreComercial })));
        });

        return () => unsub();
    }, []);

    const guardarBloqueo = async (e) => {
        e.preventDefault();
        const empresa = empresas.find(emp => emp.id === nuevoBloqueo.empresaId);
        try {
            await addDoc(collection(db, "bloqueos"), {
                ...nuevoBloqueo,
                nombreEmpresa: empresa?.nombre || 'Proveedor',
                fechaRegistro: new Date(),
                disponibles: nuevoBloqueo.totalLugares
            });
            setShowModal(false);
        } catch (err) { console.error(err); }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Panel de Bloqueos</h2>
                <button onClick={() => setShowModal(true)} className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg transition-all">
                    <Plus size={20} /> Nuevo Bloqueo
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {bloqueos.map(bloqueo => {
                    const porcentaje = (bloqueo.lugaresVendidos / bloqueo.totalLugares) * 100;
                    return (
                        <div key={bloqueo.id} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                            <div className="flex justify-between items-start mb-4">
                                <div className="bg-orange-50 p-2 rounded-lg text-orange-600"><Lock size={24} /></div>
                                <div className="text-right">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase">Salida</p>
                                    <p className="text-xs font-bold text-gray-700">{bloqueo.fechaSalida}</p>
                                </div>
                            </div>

                            <h3 className="font-bold text-lg text-gray-800 mb-1">{bloqueo.nombreViaje}</h3>
                            <p className="text-xs text-blue-600 font-bold mb-4 flex items-center gap-1">
                                <Landmark size={12} /> {bloqueo.nombreEmpresa}
                            </p>

                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Ocupación</span>
                                    <span className="font-bold text-gray-800">{bloqueo.lugaresVendidos} / {bloqueo.totalLugares}</span>
                                </div>
                                {/* Barra de progreso */}
                                <div className="w-full bg-gray-100 rounded-full h-2">
                                    <div
                                        className={`h-2 rounded-full transition-all ${porcentaje > 80 ? 'bg-red-500' : 'bg-green-500'}`}
                                        style={{ width: `${porcentaje}%` }}
                                    ></div>
                                </div>
                                <p className="text-[10px] text-right text-gray-400 font-bold italic">
                                    {bloqueo.totalLugares - bloqueo.lugaresVendidos} lugares disponibles
                                </p>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* MODAL DE BLOQUEO */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
                        <div className="bg-orange-600 p-4 text-white flex justify-between items-center font-bold uppercase tracking-widest text-sm">
                            <span>Registrar Cupos / Bloqueo</span>
                            <button onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        <form onSubmit={guardarBloqueo} className="p-6 space-y-4">
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase">Socio B2B (Proveedor)</label>
                                <select required className="w-full border rounded-lg p-2 text-sm" onChange={e => setNuevoBloqueo({ ...nuevoBloqueo, empresaId: e.target.value })}>
                                    <option value="">Selecciona Empresa</option>
                                    {empresas.map(emp => <option key={emp.id} value={emp.id}>{emp.nombre}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase">Nombre del Grupo / Viaje</label>
                                <input required className="w-full border rounded-lg p-2 text-sm" type="text" placeholder="Ej. Convención Cancún Marzo" onChange={e => setNuevoBloqueo({ ...nuevoBloqueo, nombreViaje: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase">Total Lugares</label>
                                    <input required className="w-full border rounded-lg p-2 text-sm" type="number" onChange={e => setNuevoBloqueo({ ...nuevoBloqueo, totalLugares: parseInt(e.target.value) })} />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase">Fecha Salida</label>
                                    <input required className="w-full border rounded-lg p-2 text-sm" type="date" onChange={e => setNuevoBloqueo({ ...nuevoBloqueo, fechaSalida: e.target.value })} />
                                </div>
                            </div>
                            <button type="submit" className="w-full bg-orange-600 text-white font-bold py-3 rounded-lg hover:bg-orange-700 shadow-lg shadow-orange-100 transition-all uppercase text-xs tracking-widest">
                                Crear Inventario
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}