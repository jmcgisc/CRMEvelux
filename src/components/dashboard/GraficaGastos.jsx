import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#6366f1'];

export default function GraficaGastos({ movimientos }) {
    // Procesar datos para la gráfica
    const dataProcesada = movimientos
        .filter(m => m.tipo === 'Egreso')
        .reduce((acc, curr) => {
            const existing = acc.find(item => item.name === curr.categoria);
            if (existing) {
                existing.value += Number(curr.monto);
            } else {
                acc.push({ name: curr.categoria, value: Number(curr.monto) });
            }
            return acc;
        }, []);

    return (
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm h-full min-h-[400px]">
            <div className="mb-6">
                <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest">Distribución de Egresos</h3>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">Análisis por categoría operativa</p>
            </div>

            <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={dataProcesada}
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {dataProcesada.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{ borderRadius: '15px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                            itemStyle={{ fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}
                        />
                        <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'black', textTransform: 'uppercase', paddingTop: '20px' }} />
                    </PieChart>
                </ResponsiveContainer>
            </div>

            {dataProcesada.length === 0 && (
                <p className="text-center text-[10px] text-slate-300 italic">No hay egresos registrados este mes</p>
            )}
        </div>
    );
}