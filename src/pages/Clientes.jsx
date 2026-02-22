import { useEffect, useState } from 'react';
import { db } from '../firebaseConfig';
import { collection, onSnapshot, addDoc, query, orderBy } from 'firebase/firestore';
import { Plus, Search, UserPlus } from 'lucide-react';

export default function Clientes() {
    const [clientes, setClientes] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [nuevoCliente, setNuevoCliente] = useState({
        nombre: '', correo: '', celular: '', ciudad: '', perfil: 'Frecuente'
    });

    // 1. Escuchar datos de Firebase
    useEffect(() => {
        const q = query(collection(db, "clientes"), orderBy("fechaAlta", "desc"));
        const unsub = onSnapshot(q, (snap) => {
            setClientes(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => unsub();
    }, []);

    // 2. Guardar en Firebase
    const guardarCliente = async (e) => {
        e.preventDefault();
        try {
            await addDoc(collection(db, "clientes"), {
                ...nuevoCliente,
                fechaAlta: new Date().toISOString().split('T')[0],
                estatus: 'Activo'
            });
            setShowModal(false);
            setNuevoCliente({ nombre: '', correo: '', celular: '', ciudad: '', perfil: 'Frecuente' });
        } catch (err) { console.error(err); }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Directorio de Clientes</h2>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all shadow-md"
                >
                    <UserPlus size={20} /> Agregar Cliente
                </button>
            </div>

            {/* Tabla */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="p-4 text-xs font-bold text-gray-500 uppercase">Nombre</th>
                            <th className="p-4 text-xs font-bold text-gray-500 uppercase">Contacto</th>
                            <th className="p-4 text-xs font-bold text-gray-500 uppercase">Ciudad</th>
                            <th className="p-4 text-xs font-bold text-gray-500 uppercase text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {clientes.map(c => (
                            <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                                <td className="p-4 font-semibold text-blue-600">{c.nombre}</td>
                                <td className="p-4 text-sm text-gray-600">{c.correo} <br /> <span className="text-xs text-gray-400">{c.celular}</span></td>
                                <td className="p-4 text-sm">{c.ciudad}</td>
                                <td className="p-4 text-center">
                                    <button className="text-gray-400 hover:text-blue-600 font-bold text-xs uppercase">Detalles</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* MODAL */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="bg-blue-600 p-4 text-white flex justify-between items-center">
                            <h3 className="font-bold uppercase tracking-tight">Registro de Cliente</h3>
                            <button onClick={() => setShowModal(false)} className="hover:rotate-90 transition-transform">✕</button>
                        </div>
                        <form onSubmit={guardarCliente} className="p-6 space-y-4">
                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Nombre Completo</label>
                                <input required className="w-full border-gray-200 border rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" type="text" onChange={e => setNuevoCliente({ ...nuevoCliente, nombre: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Celular</label>
                                    <input className="w-full border-gray-200 border rounded-lg p-2.5 text-sm outline-none" type="text" onChange={e => setNuevoCliente({ ...nuevoCliente, celular: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Ciudad</label>
                                    <input className="w-full border-gray-200 border rounded-lg p-2.5 text-sm outline-none" type="text" onChange={e => setNuevoCliente({ ...nuevoCliente, ciudad: e.target.value })} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Correo</label>
                                <input className="w-full border-gray-200 border rounded-lg p-2.5 text-sm outline-none" type="email" onChange={e => setNuevoCliente({ ...nuevoCliente, correo: e.target.value })} />
                            </div>
                            <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all">
                                GUARDAR EN BASE DE DATOS
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}