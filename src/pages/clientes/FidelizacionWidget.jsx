import { Star, Gift, TrendingUp } from 'lucide-react';

export default function FidelizacionWidget({ cliente }) {
    const calcularNivel = (puntos) => {
        if (puntos > 5000) return { nombre: 'Platino', color: 'text-slate-400', bg: 'bg-slate-900' };
        if (puntos > 2000) return { nombre: 'Oro', color: 'text-amber-500', bg: 'bg-amber-50' };
        return { nombre: 'Bronce', color: 'text-orange-700', bg: 'bg-orange-50' };
    };

    const nivel = calcularNivel(cliente.puntos || 0);

    return (
        <div className={`p-4 rounded-2xl border border-slate-100 ${nivel.bg} transition-all`}>
            <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Evelux Rewards</span>
                <div className={`flex items-center gap-1 text-[10px] font-black uppercase ${nivel.color}`}>
                    <Star size={12} fill="currentColor" /> {nivel.nombre}
                </div>
            </div>
            <div className="flex items-end justify-between">
                <div>
                    <p className="text-2xl font-black text-slate-800">{cliente.puntos || 0}</p>
                    <p className="text-[9px] font-bold text-slate-500 uppercase italic">Puntos Disponibles</p>
                </div>
                <Gift size={24} className="text-blue-500 opacity-20" />
            </div>
        </div>
    );
}