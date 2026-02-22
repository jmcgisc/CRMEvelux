import { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';
import { db } from '../../firebaseConfig';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { Calendar as CalendarIcon, Filter, Plus } from 'lucide-react';

export default function CalendarioReservas() {
    const [eventos, setEventos] = useState([]);

    useEffect(() => {
        const q = query(collection(db, "reservas"));
        const unsub = onSnapshot(q, (snap) => {
            const data = snap.docs.map(doc => {
                const res = doc.data();
                return {
                    id: doc.id,
                    title: `${res.folio} - ${res.paxTitular}`,
                    start: res.fechaInicio,
                    end: res.fechaFin,
                    backgroundColor: res.status === 'Confirmada' ? '#10b981' : '#3b82f6',
                    borderColor: 'transparent',
                    extendedProps: {
                        hotel: res.hotelNombre,
                        pax: res.paxCantidad
                    }
                };
            });
            setEventos(data);
        });
        return () => unsub();
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
                <div>
                    <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter flex items-center gap-3">
                        Calendario Operativo <CalendarIcon className="text-blue-600" size={26} />
                    </h2>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Control de entradas, salidas y bloqueos</p>
                </div>
                <div className="flex gap-3">
                    <button className="bg-slate-100 text-slate-600 px-4 py-2 rounded-xl text-xs font-black uppercase flex items-center gap-2 hover:bg-slate-200 transition-all">
                        <Filter size={16} /> Filtrar Destino
                    </button>
                    <button className="bg-blue-600 text-white px-5 py-2 rounded-xl text-xs font-black uppercase flex items-center gap-2 shadow-lg hover:bg-blue-700 transition-all">
                        <Plus size={16} /> Nueva Reserva
                    </button>
                </div>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                <FullCalendar
                    plugins={[dayGridPlugin, interactionPlugin]}
                    initialView="dayGridMonth"
                    locale={esLocale}
                    events={eventos}
                    headerToolbar={{
                        left: 'prev,next today',
                        center: 'title',
                        right: 'dayGridMonth,dayGridWeek'
                    }}
                    eventClick={(info) => {
                        alert(`Reserva: ${info.event.title}\nHotel: ${info.event.extendedProps.hotel}\nPasajeros: ${info.event.extendedProps.pax}`);
                    }}
                    height="700px"
                    buttonText={{
                        today: 'Hoy',
                        month: 'Mes',
                        week: 'Semana'
                    }}
                    eventClassNames="rounded-lg shadow-sm font-bold text-[10px] p-1 cursor-pointer"
                />
            </div>

            <div className="flex gap-6 px-4">
                <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full"></div> Reservas Confirmadas
                </div>
                <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div> Reservas en Proceso
                </div>
                <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase">
                    <div className="w-3 h-3 bg-orange-500 rounded-full"></div> Bloqueos / Grupos
                </div>
            </div>
        </div>
    );
}
