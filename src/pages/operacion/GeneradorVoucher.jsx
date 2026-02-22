import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { MapPin, Calendar, Users, Phone, ShieldCheck, Printer, Download, QrCode } from 'lucide-react';

export default function GeneradorVoucher() {
    const { id } = useParams();
    const [reserva, setReserva] = useState(null);

    useEffect(() => {
        const fetchReserva = async () => {
            const docRef = doc(db, "reservas", id);
            const snap = await getDoc(docRef);
            if (snap.exists()) setReserva({ id: snap.id, ...snap.data() });
        };
        fetchReserva();
    }, [id]);

    if (!reserva) return <div className="p-10 text-center font-black animate-pulse text-slate-400">CARGANDO CUPÓN...</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20">
            {/* Controles de Impresión */}
            <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 no-print">
                <div>
                    <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Cupón de Servicio</h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Generado para Folio: {reserva.folio}</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => window.print()} className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-slate-800 transition-all shadow-xl">
                        <Printer size={16} /> Imprimir Voucher
                    </button>
                </div>
            </div>

            {/* El Voucher / Cupón */}
            <div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 print:shadow-none print:border-none print:m-0" id="voucher-documento">
                {/* Header Voucher */}
                <div className="bg-gradient-to-r from-blue-700 to-indigo-900 p-10 text-white flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-black italic tracking-tighter">EVELUX <span className="text-blue-300 not-italic font-light">VIAJES</span></h1>
                        <p className="text-[10px] font-bold opacity-60 uppercase tracking-[0.2em] mt-1">Stratik Cloud Business System</p>
                    </div>
                    <div className="text-right border-l border-white/20 pl-6">
                        <p className="text-[10px] font-black uppercase opacity-70">Folio de Confirmación</p>
                        <p className="text-2xl font-black tracking-tighter">{reserva.folio}</p>
                    </div>
                </div>

                <div className="p-12 space-y-10">
                    {/* Sección Titular */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-b border-slate-50 pb-10">
                        <div className="space-y-4">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Pasajero Titular</p>
                                <p className="text-xl font-black text-slate-800 uppercase">{reserva.paxTitular}</p>
                            </div>
                            <div className="flex gap-8">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Pasajeros</p>
                                    <p className="text-sm font-bold text-slate-700 flex items-center gap-2"><Users size={14} className="text-blue-500" /> {reserva.paxCantidad || 1} Personas</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Estatus</p>
                                    <p className="text-sm font-bold text-emerald-600 flex items-center gap-1 uppercase">● Confirmado</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-slate-50 p-6 rounded-3xl flex items-center justify-center border border-slate-100">
                            <div className="text-center space-y-2">
                                <QrCode size={60} className="mx-auto text-slate-800" />
                                <p className="text-[9px] font-black text-slate-400 uppercase">Documento Digital Verificado</p>
                            </div>
                        </div>
                    </div>

                    {/* Detalles del Servicio */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-blue-600">
                                <MapPin size={18} />
                                <span className="text-[10px] font-black uppercase tracking-widest">Destino & Hotel</span>
                            </div>
                            <p className="text-sm font-bold text-slate-800 uppercase">{reserva.hotelNombre || 'Hospedaje Seleccionado'}</p>
                            <p className="text-xs text-slate-500 font-medium">{reserva.destinoNombre || 'Destino Turístico'}</p>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-red-500">
                                <Calendar size={18} />
                                <span className="text-[10px] font-black uppercase tracking-widest">Check-In</span>
                            </div>
                            <p className="text-sm font-bold text-slate-800 uppercase">{reserva.fechaInicio}</p>
                            <p className="text-xs text-slate-500 font-medium italic">Sujeto a disponibilidad de habitación</p>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-slate-400">
                                <Calendar size={18} />
                                <span className="text-[10px] font-black uppercase tracking-widest">Check-Out</span>
                            </div>
                            <p className="text-sm font-bold text-slate-800 uppercase">{reserva.fechaFin}</p>
                        </div>
                    </div>

                    {/* Descripción Amplia */}
                    <div className="bg-slate-900 rounded-[2rem] p-8 text-white relative overflow-hidden">
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-4">Servicios Incluidos / Notas Importantes</p>
                        <p className="text-xs leading-relaxed font-medium text-slate-300 whitespace-pre-line relative z-10">
                            {reserva.detalles || "Este cupón ampara los servicios de hospedaje descritos anteriormente. Es obligatorio presentar una identificación oficial al momento del Check-in."}
                        </p>
                        <ShieldCheck className="absolute -bottom-6 -right-6 text-white/5 w-32 h-32" />
                    </div>

                    {/* Footer con Soporte */}
                    <div className="flex justify-between items-end border-t border-slate-100 pt-8">
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase">Asistencia 24/7 en viaje</p>
                            <div className="flex items-center gap-3 text-blue-600 font-black">
                                <Phone size={14} /> <span>+52 55 XXXX XXXX</span>
                            </div>
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">soporte@evelux.mx</p>
                        </div>
                        <div className="text-right opacity-30 italic">
                            <p className="text-[10px] font-black">Powered by Stratik Cloud</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}