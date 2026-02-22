import { useState } from 'react';
import { db } from '../../firebaseConfig';
import { doc, updateDoc, arrayUnion, increment } from 'firebase/firestore';
import { Wallet, Plus, History, CheckCircle } from 'lucide-react';

export default function AbonosReserva({ reserva, onClose }) {
    const [montoAbono, setMontoAbono] = useState("");
    const [metodo, setMetodo] = useState("Transferencia");

    const registrarAbono = async (e) => {
        e.preventDefault();
        const monto = Number(montoAbono);
        if (monto <= 0) return alert("Monto inválido");

        const reservaRef = doc(db, "reservas", reserva.id);

        try {
            await updateDoc(reservaRef, {
                pagado: increment(monto),
                historialAbonos: arrayUnion({
                    monto,
                    metodo,
                    fecha: new Date().toLocaleString(),
                    usuario: "José Manuel Carreiro"
                })
            });
            alert("Abono registrado con éxito");
            onClose();
        } catch (err) { console.error(err); }
    };

    const saldoPendiente = Number(reserva.montoTotal) - (Number(reserva.pagado) || 0);

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[150] p-4">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden border border-white/20">
                <div className="bg-slate-800 p-5 text-white flex justify-between items-center">
                    <h3 className="font-black text-xs uppercase tracking-widest flex items-center gap-2">
                        <Wallet size={16} /> Registrar Abono - Folio {reserva.folio}
                    </h3>
                    <button onClick={onClose}>✕</button>
                </div>

                <div className="p-8 space-y-6">
                    {/* Resumen de Cuenta */}
                    <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase">Venta Total</p>
                            <p className="text-xl font-black text-slate-800">${Number(reserva.montoTotal).toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-black text-slate-400 uppercase">Saldo Pendiente</p>
                            <p className="text-xl font-black text-red-500">${saldoPendiente.toLocaleString()}</p>
                        </div>
                    </div>

                    {/* Formulario de Abono */}
                    <form onSubmit={registrarAbono} className="space-y-4">
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Monto a abonar ({reserva.moneda})</label>
                            <input
                                required
                                type="number"
                                className="w-full border-2 border-slate-100 rounded-xl p-3 text-lg font-black text-blue-600 outline-none focus:border-blue-500"
                                value={montoAbono}
                                onChange={(e) => setMontoAbono(e.target.value)}
                                max={saldoPendiente}
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Método de Pago</label>
                            <select className="w-full border-2 border-slate-100 rounded-xl p-3 text-sm outline-none" onChange={(e) => setMetodo(e.target.value)}>
                                <option value="Transferencia">Transferencia</option>
                                <option value="Efectivo">Efectivo</option>
                                <option value="Tarjeta">Tarjeta de Crédito/Débito</option>
                            </select>
                        </div>
                        <button type="submit" className="w-full bg-emerald-600 text-white font-black py-4 rounded-2xl hover:bg-emerald-700 shadow-xl transition-all uppercase text-xs">
                            Confirmar Pago Recibido
                        </button>
                    </form>

                    {/* Historial de Pagos */}
                    <div className="space-y-3">
                        <p className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-2">
                            <History size={12} /> Historial de Pagos
                        </p>
                        <div className="max-h-40 overflow-y-auto space-y-2 pr-2 font-medium">
                            {reserva.historialAbonos?.map((a, i) => (
                                <div key={i} className="flex justify-between items-center text-xs p-3 bg-white border border-slate-100 rounded-xl shadow-sm">
                                    <div>
                                        <span className="font-bold text-slate-700">${a.monto.toLocaleString()}</span>
                                        <p className="text-[9px] text-slate-400">{a.fecha}</p>
                                    </div>
                                    <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full text-[9px] font-black uppercase">
                                        {a.metodo}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}