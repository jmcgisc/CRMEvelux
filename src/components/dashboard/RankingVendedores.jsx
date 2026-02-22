import { Target, TrendingUp, User } from 'lucide-react';

export default function RankingVendedores({ empleados }) {
    // Simulamos un cálculo de ventas actuales para la demo (en producción vendría de tus reservaciones)
    const calcularProgreso = (meta) => {
        const ventaSimulada = Math.floor(Math.random() * (meta * 1.1)); // Simulación
        const porcentaje = (ventaSimulada / meta) * 100;
        return {
            monto: ventaSimulada,
            porcentaje: Math.min(porcentaje, 100).toFixed(0)
        };
    };

    return (
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm h-full">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest">Top Performance</h3>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">Cumplimiento de Metas Mensuales</p>
                </div>
                <TrendingUp className="text-emerald-500" size={20} />
            </div>

            <div className="space-y-6">
                {empleados.slice(0, 5).sort((a, b) => b.meta - a.meta).map((emp) => {
                    const stats = calcularProgreso(emp.meta);
                    return (
                        <div key={emp.id} className="group">
                            <div className="flex justify-between items-end mb-2">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                        <User size={14} />
                                    </div>
                                    <div>
                                        <p className="text-[11px] font-black text-slate-700 uppercase leading-none">{emp.nombre}</p>
                                        <p className="text-[9px] text-slate-400 font-bold">{emp.puesto}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-slate-800">${Number(stats.monto).toLocaleString()}</p>
                                    <p className="text-[8px] font-bold text-slate-400 uppercase">Meta: ${Number(emp.meta).toLocaleString()}</p>
                                </div>
                            </div>

                            {/* Barra de Progreso */}
                            <div className="relative w-full h-2 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                                <div
                                    className={`h-full transition-all duration-1000 ease-out rounded-full ${Number(stats.porcentaje) >= 100 ? 'bg-emerald-500' : 'bg-blue-600'
                                        }`}
                                    style={{ width: `${stats.porcentaje}%` }}
                                ></div>
                            </div>
                            <div className="flex justify-end mt-1">
                                <span className="text-[9px] font-black text-slate-400">{stats.porcentaje}%</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}