import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebaseConfig';
import { collection, getDocs, doc, runTransaction, increment } from 'firebase/firestore';
import { Calculator, Package as PackageIcon, CheckCircle, Printer, FileText, Gift, Info } from 'lucide-react';

export default function Cotizador() {
    const navigate = useNavigate();
    const VALOR_PUNTO = 0.10; // Cada punto equivale a $0.10 MXN

    // Estados para catálogos
    const [clientes, setClientes] = useState([]);
    const [paquetes, setPaquetes] = useState([]);

    // Estados de interfaz y canje
    const [showPreview, setShowPreview] = useState(false);
    const [tipoVenta, setTipoVenta] = useState('Manual');
    const [usarPuntos, setUsarPuntos] = useState(false);
    const [puntosACanjear, setPuntosACanjear] = useState(0);

    // Estado principal de la cotización
    const [cotizacion, setCotizacion] = useState({
        clienteId: '',
        nombreCliente: '',
        paqueteId: '',
        nombreServicio: '',
        total: 0,
        moneda: 'MXN',
        notas: ''
    });

    useEffect(() => {
        const cargarCatalogos = async () => {
            const snapC = await getDocs(collection(db, "clientes"));
            setClientes(snapC.docs.map(d => ({ id: d.id, ...d.data() })));
            const snapP = await getDocs(collection(db, "paquetes"));
            setPaquetes(snapP.docs.map(d => ({ id: d.id, ...d.data() })));
        };
        cargarCatalogos();
    }, []);

    // Cálculos de fidelización
    const clienteSeleccionado = clientes.find(c => c.id === cotizacion.clienteId);
    const puntosDisponibles = clienteSeleccionado?.puntos || 0;
    const descuentoPorPuntos = usarPuntos ? (puntosACanjear * VALOR_PUNTO) : 0;
    const totalConDescuento = Math.max(0, Number(cotizacion.total) - descuentoPorPuntos);
    const puntosAGanar = Math.floor(totalConDescuento / 100);

    const handlePaqueteChange = (paqueteId) => {
        const p = paquetes.find(item => item.id === paqueteId);
        if (p) {
            setCotizacion({
                ...cotizacion,
                paqueteId: p.id,
                nombreServicio: p.nombrePaquete,
                total: p.precioBase,
                notas: p.incluye
            });
        }
    };

    // TRANSACCIÓN MAESTRA: Reserva + Bloqueo + Canje + Acumulación
    const ejecutarOperacionFinal = async (bloqueoId) => {
        if (!cotizacion.clienteId) return alert("Selecciona un cliente.");
        if (usarPuntos && puntosACanjear > puntosDisponibles) return alert("El cliente no tiene puntos suficientes.");

        try {
            await runTransaction(db, async (transaction) => {
                const bloqueoRef = doc(db, "bloqueos", bloqueoId);
                const clienteRef = doc(db, "clientes", cotizacion.clienteId);
                const bloqueoSnap = await transaction.get(bloqueoRef);

                if (!bloqueoSnap.exists()) throw "El bloqueo no existe.";
                const nuevosDisponibles = bloqueoSnap.data().disponibles - 1;
                if (nuevosDisponibles < 0) throw "Sin inventario en este bloqueo.";

                // 1. Descuento de Inventario
                transaction.update(bloqueoRef, { disponibles: nuevosDisponibles });

                // 2. Lógica de Puntos (Resta los canjeados y suma los nuevos)
                const balanceFinalPuntos = (usarPuntos ? -puntosACanjear : 0) + puntosAGanar;
                transaction.update(clienteRef, {
                    puntos: increment(balanceFinalPuntos),
                    etapa: "Esperando Pago",
                    ultimoViaje: new Date().toISOString()
                });

                // 3. Registro de Reserva
                const nuevaReservaRef = doc(collection(db, "reservas"));
                transaction.set(nuevaReservaRef, {
                    ...cotizacion,
                    folio: `RES-${Date.now().toString().slice(-6)}`,
                    bloqueoId,
                    montoOriginal: Number(cotizacion.total),
                    descuentoCanje: descuentoPorPuntos,
                    montoFinal: totalConDescuento,
                    puntosUtilizados: usarPuntos ? puntosACanjear : 0,
                    puntosNuevos: puntosAGanar,
                    fechaCreacion: new Date().toISOString(),
                    estatus: 'Confirmada'
                });
            });

            alert(`¡Éxito! Reserva confirmada. Ahorro aplicado: $${descuentoPorPuntos}`);
            navigate('/operacion/calendario');
        } catch (e) {
            alert(e);
        }
    };

    return (
        <div className="space-y-6 text-slate-800 pb-20">
            {/* Header */}
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-2">
                        Cotizador & Canje <Calculator className="text-blue-600" size={24} />
                    </h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Evelux Rewards System</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Panel de Configuración */}
                <div className="space-y-6">
                    <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-6">
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Pasajero</label>
                            <select
                                className="w-full border-2 border-slate-50 rounded-2xl p-3 text-sm font-bold outline-none focus:border-blue-500"
                                onChange={e => {
                                    const c = clientes.find(cl => cl.id === e.target.value);
                                    setCotizacion({ ...cotizacion, clienteId: e.target.value, nombreCliente: c?.nombre });
                                }}
                            >
                                <option value="">--- Seleccionar Cliente ---</option>
                                {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre} (Pts: {c.puntos || 0})</option>)}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Monto Base ($)</label>
                                <input type="number" className="w-full border-2 border-slate-50 rounded-2xl p-3 font-black text-blue-600 outline-none" value={cotizacion.total} onChange={e => setCotizacion({ ...cotizacion, total: e.target.value })} />
                            </div>
                        </div>

                        {/* Módulo de Canje */}
                        <div className="bg-orange-50/50 p-6 rounded-[2rem] border border-orange-100 space-y-4">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <Gift className="text-orange-500" size={18} />
                                    <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest">Canjear Puntos</span>
                                </div>
                                <input type="checkbox" className="w-5 h-5 accent-orange-500 cursor-pointer" checked={usarPuntos} onChange={e => setUsarPuntos(e.target.checked)} />
                            </div>

                            {usarPuntos && (
                                <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                                    <p className="text-[9px] font-black text-orange-400 uppercase">Disponibles: {puntosDisponibles} pts</p>
                                    <div className="flex gap-4 items-center">
                                        <input
                                            type="number"
                                            max={puntosDisponibles}
                                            placeholder="Cantidad a usar"
                                            className="flex-1 border-2 border-white rounded-xl p-2 text-sm font-bold outline-none"
                                            onChange={e => setPuntosACanjear(Number(e.target.value))}
                                        />
                                        <div className="bg-white px-4 py-2 rounded-xl text-center shadow-sm">
                                            <p className="text-[8px] font-black text-slate-400 uppercase">Ahorro</p>
                                            <p className="text-sm font-black text-orange-600">-${descuentoPorPuntos.toLocaleString()}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <button onClick={() => setShowPreview(true)} className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl uppercase text-[10px] tracking-widest shadow-xl hover:bg-black transition-all">
                            Generar Propuesta Final
                        </button>
                    </div>
                </div>

                {/* Vista Previa del Ticket */}
                <div className="bg-slate-100 rounded-[2.5rem] p-8 border-2 border-dashed border-slate-200">
                    {showPreview ? (
                        <div className="space-y-6">
                            <div className="bg-white p-10 rounded-3xl shadow-2xl relative overflow-hidden">
                                <div className="flex justify-between border-b pb-6 mb-6">
                                    <div>
                                        <h1 className="text-xl font-black italic text-blue-900">EVELUX <span className="font-light text-slate-400">VIAJES</span></h1>
                                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Operación Stratik</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[9px] font-black text-slate-400 uppercase">Puntos a Generar</p>
                                        <p className="text-lg font-black text-emerald-500">+{puntosAGanar}</p>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Pasajero Titular</p>
                                        <p className="text-sm font-bold uppercase">{cotizacion.nombreCliente}</p>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs font-bold text-slate-500">
                                            <span>Monto Original</span>
                                            <span>${Number(cotizacion.total).toLocaleString()}</span>
                                        </div>
                                        {usarPuntos && (
                                            <div className="flex justify-between text-xs font-bold text-orange-600 italic">
                                                <span>Descuento Rewards ({puntosACanjear} pts)</span>
                                                <span>-${descuentoPorPuntos.toLocaleString()}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between items-center pt-4 border-t-2 border-slate-50">
                                            <span className="text-[10px] font-black uppercase">Total a Pagar</span>
                                            <span className="text-3xl font-black text-blue-900">${totalConDescuento.toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <button onClick={() => window.print()} className="bg-white text-slate-400 font-black py-4 rounded-2xl uppercase text-[10px] border border-slate-200 flex items-center justify-center gap-2">
                                    <Printer size={14} /> Imprimir
                                </button>
                                <button
                                    onClick={() => {
                                        const bId = prompt("ID del Bloqueo (Hotel):");
                                        if (bId) ejecutarOperacionFinal(bId);
                                    }}
                                    className="bg-blue-600 text-white font-black py-4 rounded-2xl uppercase text-[10px] shadow-lg flex items-center justify-center gap-2"
                                >
                                    <CheckCircle size={14} /> Confirmar Venta
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-4">
                            <PackageIcon size={48} />
                            <p className="text-[10px] font-black uppercase tracking-[0.2em]">Configura la cotización</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}