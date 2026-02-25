import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebaseConfig';
import { collection, getDocs, doc, runTransaction, increment, addDoc } from 'firebase/firestore';
import {
    Calculator, Package as PackageIcon, CheckCircle, Printer,
    Gift, Hotel, Plane, Bus, Utensils, MapPin, Users, Calendar,
    DollarSign, FileText, ChevronDown, ChevronUp, Plus, Trash2, Star
} from 'lucide-react';
import { VALOR_PUNTO, calcularPuntosGanados, calcularDescuentoPuntos, PORCENTAJE_ACUMULACION } from '../../utils/rewards';

const MONEDAS = ['MXN', 'USD'];
const TIPOS_SERVICIO = ['Paquete Completo', 'Solo Hotel', 'Solo Vuelos', 'Solo Traslados', 'Tour / Excursión', 'Crucero', 'Personalizado'];
const TIPOS_HABITACION = ['Estándar', 'Deluxe', 'Suite Junior', 'Suite Master', 'Vista al Mar', 'Vista al Jardín', 'Bungalow'];
const PLANES_ALIMENTACION = ['Todo Incluido (AI)', 'Solo Alojamiento (EP)', 'Desayuno Incluido (BP)', 'Media Pensión (MAP)', 'Pensión Completa (AP)'];
const TIPOS_VUELO = ['Solo Ida', 'Ida y Vuelta', 'Con Escalas', 'Vuelo Chárter'];
const TIPOS_TRASLADO = ['Compartido', 'Privado', 'Lujo', 'Shuttle'];

// ── Sección colapsable ─────────────────────────────────────────────────
function Seccion({ titulo, icon: Icon, color = 'blue', children, defaultOpen = false }) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <button type="button" onClick={() => setOpen(p => !p)}
                className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-2">
                    <div className={`bg-${color}-50 p-2 rounded-xl`}>
                        <Icon size={16} className={`text-${color}-600`} />
                    </div>
                    <span className="font-black text-slate-700 text-xs uppercase tracking-widest">{titulo}</span>
                </div>
                {open ? <ChevronUp size={15} className="text-slate-400" /> : <ChevronDown size={15} className="text-slate-400" />}
            </button>
            {open && <div className="px-5 pb-5 space-y-4 border-t border-slate-50">{children}</div>}
        </div>
    );
}

const Lbl = ({ children }) => <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{children}</label>;
const Inp = (props) => <input {...props} className={`w-full border-2 border-slate-100 rounded-xl p-2.5 text-sm outline-none focus:border-blue-400 transition-all ${props.className || ''}`} />;
const Sel = ({ children, ...props }) => (
    <select {...props} className={`w-full border-2 border-slate-100 rounded-xl p-2.5 text-sm outline-none focus:border-blue-400 ${props.className || ''}`}>
        {children}
    </select>
);

export default function Cotizador() {
    const navigate = useNavigate();

    // Catálogos
    const [clientes, setClientes] = useState([]);
    const [paquetes, setPaquetes] = useState([]);
    const [empleados, setEmpleados] = useState([]);

    // UI
    const [showPreview, setShowPreview] = useState(false);
    const [usarPuntos, setUsarPuntos] = useState(false);
    const [puntosACanjear, setPuntosA] = useState(0);

    // Servicios adicionales (líneas)
    const [serviciosExtra, setServiciosExtra] = useState([]);

    // Cotización principal
    const [cot, setCot] = useState({
        // Cliente
        clienteId: '', nombreCliente: '', telefonoCliente: '',
        correoCliente: '', ciudadOrigen: '',

        // Servicio general
        tipoServicio: '', asesorId: '', asesorNombre: '',
        moneda: 'MXN', validezCotizacion: '', referenciaInterna: '',

        // Destino
        destino: '', salida: '', regreso: '',
        numNoches: '', numAdultos: 1, numMenores: 0,
        numInfantes: 0, numPax: 1,

        // Hotel
        hotel: '', cadena: '', categoriaHotel: '',
        tipoHabitacion: '', planAlimentacion: '', fechaEntrada: '',
        fechaSalida: '', confirHotel: '',

        // Vuelos
        aerolinea: '', numVuelo: '', tipoVuelo: '',
        claseVuelo: '', escalas: '', origenVuelo: '',
        destinoVuelo: '', horaSalida: '', horaLlegada: '',
        confirVuelo: '',

        // Traslados
        tipoTraslado: '', empresaTraslado: '', confirTraslado: '',

        // Financiero
        precioPublico: 0, costoNeto: 0, utilidad: 0,
        impuestos: 0, descuentoEspecial: 0,

        // Notas
        incluye: '', noIncluye: '', observaciones: '', condiciones: '',
    });

    const set = (k, v) => setCot(p => ({ ...p, [k]: v }));

    // Al cambiar cliente, resetear canje
    const handleClienteChange = (id) => {
        const c = clientes.find(x => x.id === id);
        setCot(p => ({ ...p, clienteId: id, nombreCliente: c?.nombre || '', correoCliente: c?.correo || '', telefonoCliente: c?.celular || '' }));
        setPuntosA(0);
        setUsarPuntos(false);
    };

    useEffect(() => {
        Promise.all([
            getDocs(collection(db, 'clientes')),
            getDocs(collection(db, 'paquetes')),
            getDocs(collection(db, 'empleados')),
        ]).then(([snapC, snapP, snapE]) => {
            setClientes(snapC.docs.map(d => ({ id: d.id, ...d.data() })));
            setPaquetes(snapP.docs.map(d => ({ id: d.id, ...d.data() })));
            setEmpleados(snapE.docs.map(d => ({ id: d.id, ...d.data() })));
        });
    }, []);

    // Cálculos
    const clienteSel = clientes.find(c => c.id === cot.clienteId);
    const puntosDispon = clienteSel?.puntos || 0;
    const descuentoPuntos = usarPuntos ? calcularDescuentoPuntos(puntosACanjear) : 0;
    const totalServExtra = serviciosExtra.reduce((a, s) => a + Number(s.precio || 0), 0);
    const subtotal = Number(cot.precioPublico) + totalServExtra;
    const totalFinal = Math.max(0, subtotal - Number(cot.descuentoEspecial) - descuentoPuntos);
    const utilidad = totalFinal - Number(cot.costoNeto);
    // 0.5% de la venta en MXN → convertido a puntos (10 pts = $1)
    const valorPuntosGanados = totalFinal * PORCENTAJE_ACUMULACION;   // MXN
    const puntosAGanar = calcularPuntosGanados(totalFinal);
    const folio = cot.referenciaInterna || `COT-${Date.now().toString().slice(-6)}`;

    const handlePaquete = (id) => {
        const p = paquetes.find(x => x.id === id);
        if (p) {
            set('tipoServicio', 'Paquete Completo');
            set('nombreServicio', p.nombrePaquete);
            set('precioPublico', p.precioBase || 0);
            set('incluye', p.incluye || '');
        }
    };

    const agregarServicio = () =>
        setServiciosExtra(p => [...p, { id: Date.now(), descripcion: '', precio: 0 }]);

    const quitarServicio = (id) =>
        setServiciosExtra(p => p.filter(s => s.id !== id));

    const updateServicio = (id, campo, valor) =>
        setServiciosExtra(p => p.map(s => s.id === id ? { ...s, [campo]: valor } : s));

    // Guardar en Firestore
    const guardarCotizacion = async () => {
        if (!cot.nombreCliente) return alert('Ingresa el nombre del cliente.');
        try {
            const docRef = await addDoc(collection(db, 'cotizaciones'), {
                ...cot, folio,
                serviciosExtra, usarPuntos, puntosACanjear,
                descuentoPuntos, totalFinal, utilidad, puntosAGanar,
                fecha: new Date().toISOString(),
                estatus: 'Borrador'
            });
            alert(`Cotización guardada: ${folio}`);
        } catch (e) { console.error(e); }
    };

    return (
        <div className="space-y-6 pb-20">

            {/* Header */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-wrap justify-between items-center gap-4">
                <div>
                    <h2 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-2">
                        Cotizador & Canje <Calculator className="text-blue-600" size={24} />
                    </h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Evelux Viajes · Agencia de Viajes</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={guardarCotizacion}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-black px-4 py-2.5 rounded-xl text-xs uppercase tracking-wide transition-all">
                        Guardar borrador
                    </button>
                    <button onClick={() => setShowPreview(p => !p)}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-black px-5 py-2.5 rounded-xl text-xs uppercase tracking-widest shadow-lg transition-all">
                        {showPreview ? 'Editar' : 'Vista Previa'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">

                {/* ═══════════ FORMULARIO (3/5) ═══════════ */}
                <div className="xl:col-span-3 space-y-4">

                    {/* ── 1. Cliente & Asesor ── */}
                    <Seccion titulo="Cliente & Asesor" icon={Users} color="blue" defaultOpen>
                        <div className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <Lbl>Seleccionar cliente del CRM</Lbl>
                                <Sel onChange={e => handleClienteChange(e.target.value)}>
                                    <option value="">— Buscar en directorio —</option>
                                    {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre} {c.puntos ? `(${c.puntos} pts)` : ''}</option>)}
                                </Sel>
                            </div>
                            <div>
                                <Lbl>Nombre del pasajero titular *</Lbl>
                                <Inp value={cot.nombreCliente} onChange={e => set('nombreCliente', e.target.value)} placeholder="Nombre completo" />
                            </div>
                            <div>
                                <Lbl>Teléfono / WhatsApp</Lbl>
                                <Inp value={cot.telefonoCliente} onChange={e => set('telefonoCliente', e.target.value)} placeholder="+52 33 1234 5678" />
                            </div>
                            <div>
                                <Lbl>Correo electrónico</Lbl>
                                <Inp type="email" value={cot.correoCliente} onChange={e => set('correoCliente', e.target.value)} placeholder="cliente@email.com" />
                            </div>
                            <div>
                                <Lbl>Ciudad de origen</Lbl>
                                <Inp value={cot.ciudadOrigen} onChange={e => set('ciudadOrigen', e.target.value)} placeholder="Ej. Guadalajara" />
                            </div>
                            <div>
                                <Lbl>Asesor de viajes</Lbl>
                                <Sel onChange={e => {
                                    const emp = empleados.find(x => x.id === e.target.value);
                                    setCot(p => ({ ...p, asesorId: e.target.value, asesorNombre: emp?.nombre || '' }));
                                }}>
                                    <option value="">— Seleccionar asesor —</option>
                                    {empleados.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                                </Sel>
                            </div>
                            <div>
                                <Lbl>Referencia interna / Folio</Lbl>
                                <Inp value={cot.referenciaInterna} onChange={e => set('referenciaInterna', e.target.value)} placeholder="COT-2025-001" />
                            </div>
                            <div>
                                <Lbl>Validez de la cotización</Lbl>
                                <Inp type="date" value={cot.validezCotizacion} onChange={e => set('validezCotizacion', e.target.value)} />
                            </div>
                        </div>
                    </Seccion>

                    {/* ── 2. Destino & Fechas ── */}
                    <Seccion titulo="Destino & Viajeros" icon={MapPin} color="emerald" defaultOpen>
                        <div className="pt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                            <div className="col-span-2 md:col-span-3">
                                <Lbl>Tipo de servicio</Lbl>
                                <Sel value={cot.tipoServicio} onChange={e => set('tipoServicio', e.target.value)}>
                                    <option value="">— Seleccionar tipo —</option>
                                    {TIPOS_SERVICIO.map(t => <option key={t}>{t}</option>)}
                                </Sel>
                            </div>
                            <div className="col-span-2 md:col-span-3">
                                <Lbl>Cargar desde paquete</Lbl>
                                <Sel onChange={e => handlePaquete(e.target.value)}>
                                    <option value="">— Opcional: seleccionar paquete —</option>
                                    {paquetes.map(p => <option key={p.id} value={p.id}>{p.nombrePaquete}</option>)}
                                </Sel>
                            </div>
                            <div className="col-span-2 md:col-span-3">
                                <Lbl>Destino</Lbl>
                                <Inp value={cot.destino} onChange={e => set('destino', e.target.value)} placeholder="Ej. Cancún, Quintana Roo" />
                            </div>
                            <div>
                                <Lbl>Fecha de salida</Lbl>
                                <Inp type="date" value={cot.salida} onChange={e => set('salida', e.target.value)} />
                            </div>
                            <div>
                                <Lbl>Fecha de regreso</Lbl>
                                <Inp type="date" value={cot.regreso} onChange={e => set('regreso', e.target.value)} />
                            </div>
                            <div>
                                <Lbl>Núm. noches</Lbl>
                                <Inp type="number" min="1" value={cot.numNoches} onChange={e => set('numNoches', e.target.value)} />
                            </div>
                            <div>
                                <Lbl>Adultos</Lbl>
                                <Inp type="number" min="1" value={cot.numAdultos} onChange={e => set('numAdultos', e.target.value)} />
                            </div>
                            <div>
                                <Lbl>Menores (2–12 años)</Lbl>
                                <Inp type="number" min="0" value={cot.numMenores} onChange={e => set('numMenores', e.target.value)} />
                            </div>
                            <div>
                                <Lbl>Infantes (0–2 años)</Lbl>
                                <Inp type="number" min="0" value={cot.numInfantes} onChange={e => set('numInfantes', e.target.value)} />
                            </div>
                        </div>
                    </Seccion>

                    {/* ── 3. Hotel ── */}
                    <Seccion titulo="Alojamiento / Hotel" icon={Hotel} color="violet">
                        <div className="pt-4 grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <Lbl>Nombre del hotel</Lbl>
                                <Inp value={cot.hotel} onChange={e => set('hotel', e.target.value)} placeholder="Ej. Grand Velas Riviera Maya" />
                            </div>
                            <div>
                                <Lbl>Cadena hotelera</Lbl>
                                <Inp value={cot.cadena} onChange={e => set('cadena', e.target.value)} placeholder="Ej. Velas Resorts" />
                            </div>
                            <div>
                                <Lbl>Categoría</Lbl>
                                <Sel value={cot.categoriaHotel} onChange={e => set('categoriaHotel', e.target.value)}>
                                    <option value="">— Seleccionar —</option>
                                    {['★★★', '★★★★', '★★★★★', 'Gran Turismo'].map(c => <option key={c}>{c}</option>)}
                                </Sel>
                            </div>
                            <div>
                                <Lbl>Tipo de habitación</Lbl>
                                <Sel value={cot.tipoHabitacion} onChange={e => set('tipoHabitacion', e.target.value)}>
                                    <option value="">— Seleccionar —</option>
                                    {TIPOS_HABITACION.map(t => <option key={t}>{t}</option>)}
                                </Sel>
                            </div>
                            <div>
                                <Lbl>Plan de alimentación</Lbl>
                                <Sel value={cot.planAlimentacion} onChange={e => set('planAlimentacion', e.target.value)}>
                                    <option value="">— Seleccionar —</option>
                                    {PLANES_ALIMENTACION.map(p => <option key={p}>{p}</option>)}
                                </Sel>
                            </div>
                            <div>
                                <Lbl>Check-in</Lbl>
                                <Inp type="date" value={cot.fechaEntrada} onChange={e => set('fechaEntrada', e.target.value)} />
                            </div>
                            <div>
                                <Lbl>Check-out</Lbl>
                                <Inp type="date" value={cot.fechaSalida} onChange={e => set('fechaSalida', e.target.value)} />
                            </div>
                            <div className="col-span-2">
                                <Lbl>Núm. confirmación hotel</Lbl>
                                <Inp value={cot.confirHotel} onChange={e => set('confirHotel', e.target.value)} placeholder="Código de reserva" />
                            </div>
                        </div>
                    </Seccion>

                    {/* ── 4. Vuelos ── */}
                    <Seccion titulo="Vuelos / Traslado Aéreo" icon={Plane} color="sky">
                        <div className="pt-4 grid grid-cols-2 gap-4">
                            <div>
                                <Lbl>Aerolínea</Lbl>
                                <Inp value={cot.aerolinea} onChange={e => set('aerolinea', e.target.value)} placeholder="Ej. Aeroméxico" />
                            </div>
                            <div>
                                <Lbl>Número de vuelo</Lbl>
                                <Inp value={cot.numVuelo} onChange={e => set('numVuelo', e.target.value)} placeholder="AM 456" />
                            </div>
                            <div>
                                <Lbl>Tipo de vuelo</Lbl>
                                <Sel value={cot.tipoVuelo} onChange={e => set('tipoVuelo', e.target.value)}>
                                    <option value="">— Seleccionar —</option>
                                    {TIPOS_VUELO.map(t => <option key={t}>{t}</option>)}
                                </Sel>
                            </div>
                            <div>
                                <Lbl>Clase</Lbl>
                                <Sel value={cot.claseVuelo} onChange={e => set('claseVuelo', e.target.value)}>
                                    <option value="">— Seleccionar —</option>
                                    {['Económica', 'Business', 'Primera Clase'].map(c => <option key={c}>{c}</option>)}
                                </Sel>
                            </div>
                            <div>
                                <Lbl>Origen</Lbl>
                                <Inp value={cot.origenVuelo} onChange={e => set('origenVuelo', e.target.value)} placeholder="GDL" />
                            </div>
                            <div>
                                <Lbl>Destino</Lbl>
                                <Inp value={cot.destinoVuelo} onChange={e => set('destinoVuelo', e.target.value)} placeholder="CUN" />
                            </div>
                            <div>
                                <Lbl>Hora de salida</Lbl>
                                <Inp type="time" value={cot.horaSalida} onChange={e => set('horaSalida', e.target.value)} />
                            </div>
                            <div>
                                <Lbl>Hora de llegada</Lbl>
                                <Inp type="time" value={cot.horaLlegada} onChange={e => set('horaLlegada', e.target.value)} />
                            </div>
                            <div className="col-span-2">
                                <Lbl>Escalas (si aplica)</Lbl>
                                <Inp value={cot.escalas} onChange={e => set('escalas', e.target.value)} placeholder="Ej. MEX 2h30m" />
                            </div>
                            <div className="col-span-2">
                                <Lbl>Núm. confirmación vuelo</Lbl>
                                <Inp value={cot.confirVuelo} onChange={e => set('confirVuelo', e.target.value)} />
                            </div>
                        </div>
                    </Seccion>

                    {/* ── 5. Traslados ── */}
                    <Seccion titulo="Traslados Terrestres" icon={Bus} color="orange">
                        <div className="pt-4 grid grid-cols-2 gap-4">
                            <div>
                                <Lbl>Tipo de traslado</Lbl>
                                <Sel value={cot.tipoTraslado} onChange={e => set('tipoTraslado', e.target.value)}>
                                    <option value="">— Seleccionar —</option>
                                    {TIPOS_TRASLADO.map(t => <option key={t}>{t}</option>)}
                                </Sel>
                            </div>
                            <div>
                                <Lbl>Empresa de traslados</Lbl>
                                <Inp value={cot.empresaTraslado} onChange={e => set('empresaTraslado', e.target.value)} placeholder="Ej. Best Day" />
                            </div>
                            <div className="col-span-2">
                                <Lbl>Núm. confirmación traslado</Lbl>
                                <Inp value={cot.confirTraslado} onChange={e => set('confirTraslado', e.target.value)} />
                            </div>
                        </div>
                    </Seccion>

                    {/* ── 6. Servicios Adicionales ── */}
                    <Seccion titulo="Servicios Adicionales" icon={Utensils} color="amber">
                        <div className="pt-4 space-y-3">
                            {serviciosExtra.map(s => (
                                <div key={s.id} className="flex gap-2 items-center">
                                    <Inp placeholder="Descripción del servicio" value={s.descripcion}
                                        onChange={e => updateServicio(s.id, 'descripcion', e.target.value)} className="flex-1" />
                                    <Inp type="number" placeholder="$" value={s.precio}
                                        onChange={e => updateServicio(s.id, 'precio', e.target.value)} className="w-28" />
                                    <button onClick={() => quitarServicio(s.id)} className="text-red-300 hover:text-red-500 p-2 transition-colors">
                                        <Trash2 size={15} />
                                    </button>
                                </div>
                            ))}
                            <button onClick={agregarServicio} type="button"
                                className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-amber-200 text-amber-500 rounded-xl py-2.5 text-xs font-black uppercase hover:border-amber-400 transition-all">
                                <Plus size={14} /> Agregar servicio
                            </button>
                        </div>
                    </Seccion>

                    {/* ── 7. Precios & Financiero ── */}
                    <Seccion titulo="Precios & Finanzas" icon={DollarSign} color="emerald" defaultOpen>
                        <div className="pt-4 grid grid-cols-2 gap-4">
                            <div>
                                <Lbl>Moneda</Lbl>
                                <Sel value={cot.moneda} onChange={e => set('moneda', e.target.value)}>
                                    {MONEDAS.map(m => <option key={m}>{m}</option>)}
                                </Sel>
                            </div>
                            <div>
                                <Lbl>Precio público (por pax)</Lbl>
                                <Inp type="number" value={cot.precioPublico} onChange={e => set('precioPublico', e.target.value)} placeholder="0.00" />
                            </div>
                            <div>
                                <Lbl>Costo neto (interno)</Lbl>
                                <Inp type="number" value={cot.costoNeto} onChange={e => set('costoNeto', e.target.value)} placeholder="0.00" />
                            </div>
                            <div>
                                <Lbl>Impuestos / Tasas</Lbl>
                                <Inp type="number" value={cot.impuestos} onChange={e => set('impuestos', e.target.value)} placeholder="0.00" />
                            </div>
                            <div>
                                <Lbl>Descuento especial ($)</Lbl>
                                <Inp type="number" value={cot.descuentoEspecial} onChange={e => set('descuentoEspecial', e.target.value)} placeholder="0.00" />
                            </div>

                            {/* Resumen financiero */}
                            <div className="col-span-2 bg-slate-50 rounded-2xl p-4 space-y-2 text-xs font-bold">
                                <div className="flex justify-between text-slate-500"><span>Precio base</span><span>${Number(cot.precioPublico).toLocaleString()} {cot.moneda}</span></div>
                                {totalServExtra > 0 && <div className="flex justify-between text-amber-600"><span>+ Servicios extra</span><span>+${totalServExtra.toLocaleString()}</span></div>}
                                {cot.descuentoEspecial > 0 && <div className="flex justify-between text-red-500"><span>- Descuento esp.</span><span>-${Number(cot.descuentoEspecial).toLocaleString()}</span></div>}
                                {descuentoPuntos > 0 && <div className="flex justify-between text-orange-500"><span>- Canje puntos</span><span>-${descuentoPuntos.toLocaleString()}</span></div>}
                                <div className="flex justify-between text-slate-800 font-black text-base border-t border-slate-200 pt-2">
                                    <span>Total</span><span>${totalFinal.toLocaleString()} {cot.moneda}</span>
                                </div>
                                <div className="flex justify-between text-emerald-600"><span>Utilidad estimada</span><span>${utilidad.toLocaleString()}</span></div>
                            </div>
                        </div>
                    </Seccion>

                    {/* ── 8. Canje de puntos ── */}
                    <div className={`rounded-2xl border p-5 transition-all ${puntosDispon > 0
                        ? 'bg-orange-50 border-orange-100'
                        : 'bg-slate-50 border-slate-100 opacity-60'
                        }`}>
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <Gift className={puntosDispon > 0 ? 'text-orange-500' : 'text-slate-300'} size={18} />
                                <div>
                                    <span className={`font-black text-xs uppercase tracking-widest ${puntosDispon > 0 ? 'text-orange-700' : 'text-slate-400'
                                        }`}>Canjear Puntos Evelux Rewards</span>
                                    {puntosDispon === 0 && (
                                        <p className="text-[9px] text-slate-400 font-medium">Este cliente no tiene puntos disponibles</p>
                                    )}
                                </div>
                            </div>
                            <input
                                type="checkbox"
                                className="w-5 h-5 accent-orange-500 cursor-pointer disabled:cursor-not-allowed"
                                checked={usarPuntos}
                                disabled={puntosDispon === 0}
                                onChange={e => {
                                    setUsarPuntos(e.target.checked);
                                    if (!e.target.checked) setPuntosA(0);
                                }}
                            />
                        </div>
                        {usarPuntos && puntosDispon > 0 && (
                            <div className="space-y-3">
                                <p className="text-[9px] font-black text-orange-500 uppercase">
                                    Disponibles: {puntosDispon} pts · Equivale a ${(puntosDispon * VALOR_PUNTO).toFixed(2)} MXN de descuento
                                </p>
                                <div className="flex gap-3 items-center">
                                    <input
                                        type="number"
                                        min={0}
                                        max={puntosDispon}
                                        value={puntosACanjear}
                                        placeholder="Puntos a usar"
                                        className="flex-1 border-2 border-orange-200 rounded-xl p-2.5 text-sm font-bold outline-none focus:border-orange-400"
                                        onChange={e => {
                                            // Clampear al máximo disponible
                                            const val = Math.min(Number(e.target.value), puntosDispon);
                                            setPuntosA(Math.max(0, val));
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setPuntosA(puntosDispon)}
                                        className="text-[9px] font-black text-orange-600 bg-orange-100 hover:bg-orange-200 px-3 py-2 rounded-xl uppercase transition-all whitespace-nowrap"
                                    >
                                        Usar todos
                                    </button>
                                    <div className="bg-white px-4 py-2 rounded-xl text-center border border-orange-100 flex-shrink-0">
                                        <p className="text-[8px] font-black text-slate-400 uppercase">Ahorro</p>
                                        <p className="font-black text-orange-600">-${descuentoPuntos.toLocaleString()}</p>
                                    </div>
                                </div>
                                {/* Barra de uso */}
                                <div className="w-full bg-orange-100 rounded-full h-1.5">
                                    <div
                                        className="bg-orange-400 h-1.5 rounded-full transition-all"
                                        style={{ width: `${Math.min((puntosACanjear / puntosDispon) * 100, 100)}%` }}
                                    />
                                </div>
                                <p className="text-[9px] text-orange-400 text-right">{puntosACanjear} / {puntosDispon} pts usados</p>
                            </div>
                        )}
                    </div>

                    {/* ── 9. Notas & Condiciones ── */}
                    <Seccion titulo="Notas & Condiciones" icon={FileText} color="slate">
                        <div className="pt-4 space-y-4">
                            <div>
                                <Lbl>¿Qué incluye?</Lbl>
                                <textarea rows={3} className="w-full border-2 border-slate-100 rounded-xl p-2.5 text-sm outline-none focus:border-blue-400 resize-none"
                                    value={cot.incluye} onChange={e => set('incluye', e.target.value)}
                                    placeholder="Vuelo redondo, hotel 5★ AI, traslados, seguro de viaje..." />
                            </div>
                            <div>
                                <Lbl>¿Qué NO incluye?</Lbl>
                                <textarea rows={2} className="w-full border-2 border-slate-100 rounded-xl p-2.5 text-sm outline-none focus:border-blue-400 resize-none"
                                    value={cot.noIncluye} onChange={e => set('noIncluye', e.target.value)}
                                    placeholder="Gastos personales, propinas, excursiones opcionales..." />
                            </div>
                            <div>
                                <Lbl>Condiciones de pago / cancelación</Lbl>
                                <textarea rows={2} className="w-full border-2 border-slate-100 rounded-xl p-2.5 text-sm outline-none focus:border-blue-400 resize-none"
                                    value={cot.condiciones} onChange={e => set('condiciones', e.target.value)}
                                    placeholder="50% anticipo al confirmar, saldo 30 días antes..." />
                            </div>
                            <div>
                                <Lbl>Observaciones internas</Lbl>
                                <textarea rows={2} className="w-full border-2 border-slate-100 rounded-xl p-2.5 text-sm outline-none focus:border-blue-400 resize-none"
                                    value={cot.observaciones} onChange={e => set('observaciones', e.target.value)}
                                    placeholder="Notas para el asesor (no se imprimen)" />
                            </div>
                        </div>
                    </Seccion>
                </div>

                {/* ═══════════ VISTA PREVIA / PROPUESTA (2/5) ═══════════ */}
                <div className="xl:col-span-2">
                    <div className="sticky top-6 space-y-4">
                        {!showPreview ? (
                            <div className="bg-slate-100 rounded-2xl border-2 border-dashed border-slate-200 p-12 flex flex-col items-center justify-center text-slate-300 gap-3">
                                <PackageIcon size={48} />
                                <p className="text-[10px] font-black uppercase tracking-widest text-center">Completa el formulario<br />y presiona Vista Previa</p>
                            </div>
                        ) : (
                            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100 text-[11px]" id="cotizacion-print">

                                {/* Encabezado propuesta */}
                                <div className="bg-gradient-to-r from-blue-800 to-blue-900 p-6 text-white">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h1 className="text-lg font-black italic tracking-tight">EVELUX <span className="font-light opacity-60">VIAJES</span></h1>
                                            <p className="text-blue-300 text-[8px] font-bold uppercase tracking-widest">Agencia de Viajes · Operación Stratik</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[8px] font-black text-blue-300 uppercase">Folio</p>
                                            <p className="font-black text-sm">{folio}</p>
                                            <p className="text-blue-300 text-[8px]">Válido: {cot.validezCotizacion || 'N/D'}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-5 space-y-4">
                                    {/* Cliente */}
                                    <div className="bg-slate-50 rounded-xl p-3">
                                        <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Pasajero Titular</p>
                                        <p className="font-black text-slate-800 uppercase text-sm">{cot.nombreCliente || '—'}</p>
                                        {cot.telefonoCliente && <p className="text-slate-500">{cot.telefonoCliente}</p>}
                                        {cot.correoCliente && <p className="text-slate-500">{cot.correoCliente}</p>}
                                        {cot.asesorNombre && <p className="text-blue-500 font-bold mt-1">Asesor: {cot.asesorNombre}</p>}
                                    </div>

                                    {/* Destino */}
                                    <div>
                                        <p className="text-[8px] font-black text-slate-400 uppercase mb-2">Detalles del Viaje</p>
                                        <div className="space-y-1.5">
                                            {cot.destino && <PreviewRow label="Destino" value={cot.destino} />}
                                            {cot.tipoServicio && <PreviewRow label="Tipo" value={cot.tipoServicio} />}
                                            {(cot.salida || cot.regreso) && <PreviewRow label="Fechas" value={`${cot.salida || '?'} → ${cot.regreso || '?'}`} />}
                                            {cot.numNoches && <PreviewRow label="Noches" value={cot.numNoches} />}
                                            <PreviewRow label="Pax" value={`${cot.numAdultos} Adulto(s) ${cot.numMenores > 0 ? `· ${cot.numMenores} Menor(es)` : ''} ${cot.numInfantes > 0 ? `· ${cot.numInfantes} Infante(s)` : ''}`} />
                                        </div>
                                    </div>

                                    {/* Hotel */}
                                    {cot.hotel && (
                                        <div>
                                            <p className="text-[8px] font-black text-slate-400 uppercase mb-2">Alojamiento</p>
                                            <div className="space-y-1.5">
                                                <PreviewRow label="Hotel" value={`${cot.hotel} ${cot.categoriaHotel || ''}`} />
                                                {cot.tipoHabitacion && <PreviewRow label="Habitación" value={cot.tipoHabitacion} />}
                                                {cot.planAlimentacion && <PreviewRow label="Plan" value={cot.planAlimentacion} />}
                                                {cot.confirHotel && <PreviewRow label="Confirmación" value={cot.confirHotel} />}
                                            </div>
                                        </div>
                                    )}

                                    {/* Vuelos */}
                                    {cot.aerolinea && (
                                        <div>
                                            <p className="text-[8px] font-black text-slate-400 uppercase mb-2">Vuelo</p>
                                            <div className="space-y-1.5">
                                                <PreviewRow label="Aerolínea" value={`${cot.aerolinea} ${cot.numVuelo}`} />
                                                {cot.origenVuelo && <PreviewRow label="Ruta" value={`${cot.origenVuelo} → ${cot.destinoVuelo}`} />}
                                                {cot.claseVuelo && <PreviewRow label="Clase" value={cot.claseVuelo} />}
                                            </div>
                                        </div>
                                    )}

                                    {/* Incluye / No incluye */}
                                    {cot.incluye && (
                                        <div className="bg-emerald-50 rounded-xl p-3">
                                            <p className="text-[8px] font-black text-emerald-600 uppercase mb-1">Incluye</p>
                                            <p className="text-slate-600 leading-relaxed">{cot.incluye}</p>
                                        </div>
                                    )}
                                    {cot.noIncluye && (
                                        <div className="bg-red-50 rounded-xl p-3">
                                            <p className="text-[8px] font-black text-red-500 uppercase mb-1">No incluye</p>
                                            <p className="text-slate-600 leading-relaxed">{cot.noIncluye}</p>
                                        </div>
                                    )}

                                    {/* Precios */}
                                    <div className="border-t-2 border-slate-100 pt-3 space-y-1.5">
                                        <div className="flex justify-between text-slate-500"><span>Precio por pax</span><span>${Number(cot.precioPublico).toLocaleString()} {cot.moneda}</span></div>
                                        {totalServExtra > 0 && <div className="flex justify-between text-amber-600"><span>Servicios extras</span><span>+${totalServExtra.toLocaleString()}</span></div>}
                                        {cot.descuentoEspecial > 0 && <div className="flex justify-between text-red-500"><span>Descuento especial</span><span>-${Number(cot.descuentoEspecial).toLocaleString()}</span></div>}
                                        {descuentoPuntos > 0 && <div className="flex justify-between text-orange-500"><span>Canje Rewards</span><span>-${descuentoPuntos.toLocaleString()}</span></div>}
                                        <div className="flex justify-between items-center pt-2 border-t border-slate-100 font-black text-base">
                                            <span className="uppercase text-[10px]">TOTAL</span>
                                            <span className="text-blue-900 text-xl">${totalFinal.toLocaleString()} <span className="text-xs font-normal text-slate-400">{cot.moneda}</span></span>
                                        </div>
                                        <div className="bg-emerald-50 rounded-xl p-2.5 border border-emerald-100">
                                            <div className="flex justify-between text-emerald-700 font-black text-xs">
                                                <span>+ Rewards ({(PORCENTAJE_ACUMULACION * 100)}% de la venta)</span>
                                                <span>+{puntosAGanar} pts</span>
                                            </div>
                                            <p className="text-[9px] text-emerald-500 mt-0.5">
                                                ${valorPuntosGanados.toFixed(2)} MXN en valor · 10 pts = $1 MXN
                                            </p>
                                        </div>
                                    </div>

                                    {cot.condiciones && (
                                        <div className="bg-slate-50 rounded-xl p-3">
                                            <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Condiciones</p>
                                            <p className="text-slate-500 leading-relaxed">{cot.condiciones}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Acciones */}
                                <div className="p-4 border-t border-slate-100 grid grid-cols-2 gap-3">
                                    <button onClick={() => window.print()}
                                        className="bg-slate-100 text-slate-600 font-black py-3 rounded-xl text-[10px] uppercase flex items-center justify-center gap-1 hover:bg-slate-200 transition-all">
                                        <Printer size={13} /> Imprimir
                                    </button>
                                    <button onClick={guardarCotizacion}
                                        className="bg-blue-600 text-white font-black py-3 rounded-xl text-[10px] uppercase flex items-center justify-center gap-1 shadow-lg hover:bg-blue-700 transition-all">
                                        <CheckCircle size={13} /> Guardar
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function PreviewRow({ label, value }) {
    return (
        <div className="flex justify-between gap-4">
            <span className="text-slate-400 font-bold flex-shrink-0">{label}</span>
            <span className="text-slate-700 font-bold text-right">{value}</span>
        </div>
    );
}