import { useEffect, useState } from 'react';
import { db } from '../firebaseConfig';
import { collection, onSnapshot, addDoc, query, orderBy, getDocs, updateDoc, doc, increment } from 'firebase/firestore';
import { Plus, MapPin, Building2, Ticket, Users, Calendar, DollarSign, Tag } from 'lucide-react';

export default function Reservaciones() {
    const [reservas, setReservas] = useState([]);
    const [clientes, setClientes] = useState([]);
    const [hoteles, setHoteles] = useState([]);
    const [destinos, setDestinos] = useState([]);
    const [bloqueos, setBloqueos] = useState([]);
    const [showModal, setShowModal] = useState(false);

    const [nuevaReserva, setNuevaReserva] = useState({
        clienteId: '',
        paxTitular: '',
        listaPasajeros: '',
        moneda: 'MXN',
        fechaInicio: '',
        fechaFin: '',
        fechaLimite: '',
        categoriaViaje: 'Nacional', // Nacional / Internacional
        tipoGrupo: 'Individual', // Individual / Grupal
        destinoId: '',
        hotelId: '',
        bloqueoId: '',
        paxCantidad: 1,
        montoTotal: 0,
        status: 'Pendiente'
    });

    useEffect(() => {
        const qReservas = query(collection(db, "reservas"), orderBy("fechaCreacion", "desc"));
        const unsubRes = onSnapshot(qReservas, (snap) => {
            setReservas(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        const cargarCatalogos = async () => {
            const snapClientes = await getDocs(collection(db, "clientes"));
            setClientes(snapClientes.docs.map(doc => ({ id: doc.id, nombre: doc.data().nombre })));

            const snapDestinos = await getDocs(collection(db, "destinos"));
            setDestinos(snapDestinos.docs.map(doc => ({ id: doc.id, nombre: doc.data().nombre })));

            const snapHoteles = await getDocs(collection(db, "hoteles"));
            setHoteles(snapHoteles.docs.map(doc => ({ id: doc.id, nombre: doc.data().nombre, destinoId: doc.data().destinoId })));

            const snapBloqueos = await getDocs(collection(db, "bloqueos"));
            setBloqueos(snapBloqueos.docs.map(d => ({ id: d.id, ...d.data() })));
        };

        cargarCatalogos();
        return () => unsubRes();
    }, []);

    const guardarReserva = async (e) => {
        e.preventDefault();
        try {
            const destinoNombre = destinos.find(d => d.id === nuevaReserva.destinoId)?.nombre || '';
            const hotelNombre = hoteles.find(h => h.id === nuevaReserva.hotelId)?.nombre || '';

            await addDoc(collection(db, "reservas"), {
                ...nuevaReserva,
                destinoNombre,
                hotelNombre,
                folio: `EV-${Date.now().toString().slice(-4)}`,
                fechaCreacion: new Date()
            });

            if (nuevaReserva.bloqueoId) {
                const bloqueoRef = doc(db, "bloqueos", nuevaReserva.bloqueoId);
                await updateDoc(bloqueoRef, {
                    lugaresVendidos: increment(nuevaReserva.paxCantidad)
                });
            }

            setShowModal(false);
            alert("Reserva creada con éxito.");
        } catch (err) { console.error("Error:", err); }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">Gestión de Reservas <Tag className="text-blue-600" /></h2>
                <button onClick={() => setShowModal(true)} className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all">
                    <Plus size={20} /> Nueva Reservación
                </button>
            </div>

            {/* Listado de Reservas */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                        <tr>
                            <th className="p-5">Folio / Titular</th>
                            <th className="p-5">Servicio / Destino</th>
                            <th className="p-5">Fechas</th>
                            <th className="p-5 text-right">Monto</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {reservas.map(r => (
                            <tr key={r.id} className="hover:bg-blue-50/50 transition-colors">
                                <td className="p-5">
                                    <div className="font-black text-blue-700">{r.folio}</div>
                                    <div className="text-slate-600 font-medium uppercase text-xs">{r.paxTitular}</div>
                                </td>
                                <td className="p-5">
                                    <div className="flex items-center gap-1 font-bold text-slate-700 uppercase"><MapPin size={12} className="text-red-500" /> {r.destinoNombre}</div>
                                    <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold"><Building2 size={12} /> {r.hotelNombre}</div>
                                </td>
                                <td className="p-5">
                                    <div className="text-xs font-bold text-slate-600">{r.fechaInicio}</div>
                                    <div className="text-[10px] text-slate-400">Límite: {r.fechaLimite || 'N/A'}</div>
                                </td>
                                <td className="p-5 text-right font-black text-slate-800 text-base">
                                    ${Number(r.montoTotal).toLocaleString()} <span className="text-[10px] text-slate-400">{r.moneda}</span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* MODAL EXTENDIDO - ESTILO RESERVANTIA */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl overflow-hidden overflow-y-auto max-h-[95vh] border border-white/20">
                        <div className="bg-slate-800 p-6 text-white flex justify-between items-center">
                            <h3 className="font-black text-sm uppercase tracking-widest flex items-center gap-2">
                                <Calendar size={18} className="text-blue-400" /> Registro de Nueva Reserva
                            </h3>
                            <button onClick={() => setShowModal(false)} className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition-all">✕</button>
                        </div>

                        <form onSubmit={guardarReserva} className="p-10 space-y-10">

                            {/* SECCIÓN 1: DATOS DEL CLIENTE */}
                            <div className="space-y-6">
                                <h4 className="text-center font-black text-blue-900 uppercase tracking-widest text-sm border-b pb-4">Datos Generales del Cliente</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="col-span-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Cliente de la Reserva</label>
                                        <select required className="w-full border-2 border-slate-100 rounded-2xl p-3 text-sm focus:border-blue-500 outline-none transition-all"
                                            onChange={e => setNuevaReserva({ ...nuevaReserva, clienteId: e.target.value })}>
                                            <option value="">Seleccione una opción</option>
                                            {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                                        </select>
                                    </div>
                                    <div className="col-span-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Pasajero Titular</label>
                                        <textarea required rows="1" className="w-full border-2 border-slate-100 rounded-2xl p-3 text-sm focus:border-blue-500 outline-none"
                                            placeholder="Nombre de quien encabeza el viaje"
                                            onChange={e => setNuevaReserva({ ...nuevaReserva, paxTitular: e.target.value })} />
                                    </div>
                                    <div className="col-span-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Lista de Pasajeros</label>
                                        <textarea rows="3" className="w-full border-2 border-slate-100 rounded-2xl p-3 text-sm"
                                            placeholder="Nombres de acompañantes..."
                                            onChange={e => setNuevaReserva({ ...nuevaReserva, listaPasajeros: e.target.value })} />
                                    </div>
                                    <div className="col-span-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Moneda de Pago</label>
                                        <select className="w-full border-2 border-slate-100 rounded-2xl p-3 text-sm"
                                            onChange={e => setNuevaReserva({ ...nuevaReserva, moneda: e.target.value })}>
                                            <option value="MXN">MXN - Pesos Mexicanos</option>
                                            <option value="USD">USD - Dólares</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* SECCIÓN 2: DATOS ADICIONALES */}
                            <div className="space-y-6">
                                <h4 className="text-center font-black text-blue-900 uppercase tracking-widest text-sm border-b pb-4">Datos Adicionales de la Reserva</h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                    <div className="col-span-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Fechas de Viaje</label>
                                        <div className="flex gap-2">
                                            <input type="date" required className="w-full border-2 border-slate-100 rounded-2xl p-3 text-xs"
                                                onChange={e => setNuevaReserva({ ...nuevaReserva, fechaInicio: e.target.value })} />
                                            <input type="date" required className="w-full border-2 border-slate-100 rounded-2xl p-3 text-xs"
                                                onChange={e => setNuevaReserva({ ...nuevaReserva, fechaFin: e.target.value })} />
                                        </div>
                                    </div>
                                    <div className="col-span-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Fecha Límite Pago Cliente</label>
                                        <input type="date" className="w-full border-2 border-slate-100 rounded-2xl p-3 text-xs"
                                            onChange={e => setNuevaReserva({ ...nuevaReserva, fechaLimite: e.target.value })} />
                                    </div>

                                    {/* Radio Buttons para Categoría */}
                                    <div className="col-span-2 space-y-3">
                                        <label className="text-[10px] font-black text-slate-400 uppercase block">Categoría y Tipo</label>
                                        <div className="flex gap-6">
                                            <label className="flex items-center gap-2 text-sm font-bold text-slate-600 cursor-pointer">
                                                <input type="radio" name="cat" value="Nacional" defaultChecked onChange={e => setNuevaReserva({ ...nuevaReserva, categoriaViaje: e.target.value })} /> Nacional
                                            </label>
                                            <label className="flex items-center gap-2 text-sm font-bold text-slate-600 cursor-pointer">
                                                <input type="radio" name="cat" value="Internacional" onChange={e => setNuevaReserva({ ...nuevaReserva, categoriaViaje: e.target.value })} /> Internacional
                                            </label>
                                        </div>
                                    </div>

                                    <div className="col-span-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Monto Total Venta</label>
                                        <div className="relative">
                                            <DollarSign className="absolute left-3 top-3 text-slate-400" size={18} />
                                            <input type="number" required className="w-full border-2 border-slate-100 rounded-2xl p-3 pl-10 text-sm font-black text-blue-700"
                                                onChange={e => setNuevaReserva({ ...nuevaReserva, montoTotal: e.target.value })} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* SECCIÓN 3: DESTINO Y HOTEL */}
                            <div className="space-y-6">
                                <h4 className="text-center font-black text-blue-900 uppercase tracking-widest text-sm border-b pb-4">Destino y Hotel</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Región Destino</label>
                                        <select required className="w-full border-2 border-slate-100 rounded-2xl p-3 text-sm"
                                            onChange={e => setNuevaReserva({ ...nuevaReserva, destinoId: e.target.value })}>
                                            <option value="">Seleccione Destino</option>
                                            {destinos.map(d => <option key={d.id} value={d.id}>{d.nombre}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Hotel Asignado</label>
                                        <select required className="w-full border-2 border-slate-100 rounded-2xl p-3 text-sm"
                                            onChange={e => setNuevaReserva({ ...nuevaReserva, hotelId: e.target.value })}>
                                            <option value="">Seleccione Hotel</option>
                                            {hoteles.filter(h => h.destinoId === nuevaReserva.destinoId).map(h => (
                                                <option key={h.id} value={h.id}>{h.nombre}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* SECCIÓN 4: VINCULACIÓN A INVENTARIO */}
                            <div className="bg-orange-50/50 p-8 rounded-[2rem] border-2 border-orange-100 space-y-4">
                                <div className="flex items-center gap-2 text-orange-700 font-black text-xs uppercase tracking-tighter">
                                    <Ticket size={20} /> Aplicar a Bloqueo de Inventario (Opcional)
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="text-[10px] font-black text-orange-400 uppercase mb-1 block">Seleccionar Bloqueo Disponible</label>
                                        <select className="w-full border-white border-2 rounded-xl p-3 text-sm shadow-sm"
                                            onChange={e => setNuevaReserva({ ...nuevaReserva, bloqueoId: e.target.value })}>
                                            <option value="">Ninguno - Venta Libre</option>
                                            {bloqueos.map(b => (
                                                <option key={b.id} value={b.id}>
                                                    {b.nombreViaje} ({b.totalLugares - b.lugaresVendidos} disp.)
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-orange-400 uppercase mb-1 block">Lugares a Ocupar</label>
                                        <input type="number" min="1" className="w-full border-white border-2 rounded-xl p-3 text-sm shadow-sm"
                                            value={nuevaReserva.paxCantidad}
                                            onChange={e => setNuevaReserva({ ...nuevaReserva, paxCantidad: parseInt(e.target.value) })} />
                                    </div>
                                </div>
                            </div>

                            <button type="submit" className="w-full bg-blue-600 text-white font-black py-5 rounded-[2rem] hover:bg-blue-700 transition-all shadow-2xl shadow-blue-200 mt-6 uppercase tracking-widest">
                                Confirmar y Generar Reservación
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}