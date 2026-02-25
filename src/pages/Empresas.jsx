import { useEffect, useState } from 'react';
import { db } from '../firebaseConfig';
import { collection, onSnapshot, addDoc, query, orderBy, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { Building2, Plus, Globe, Phone, Edit3, Trash2, Eye, X } from 'lucide-react';

export default function Empresas() {
    const [empresas, setEmpresas] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [viewDetails, setViewDetails] = useState(null); // Para el popup de detalles
    const [editingId, setEditingId] = useState(null); // Para saber si estamos editando

    const [formData, setFormData] = useState({
        // Datos Generales y Fiscales
        nombreComercial: '',
        razonSocial: '',
        rfc: '',
        regimenFiscal: '',
        usoCFDI: 'Gastos en General',

        // Dirección
        calle: '',
        numExterior: '',
        numInterior: '',
        colonia: '',
        estado: '',
        municipio: '',
        cp: '',
        pais: 'México',

        // Contacto
        contactoNombre: '',
        nombreFactura: '',
        correoB2B: '',
        telefono: '',
        sitioWeb: '',
        notas: ''
    });

    useEffect(() => {
        const q = query(collection(db, "empresas"), orderBy("nombreComercial", "asc"));
        const unsub = onSnapshot(q, (snap) => {
            setEmpresas(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => unsub();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                // ACTUALIZAR
                await updateDoc(doc(db, "empresas", editingId), formData);
            } else {
                // CREAR NUEVO
                await addDoc(collection(db, "empresas"), { ...formData, fechaRegistro: new Date() });
            }
            resetForm();
        } catch (err) { console.error(err); }
    };

    const handleDelete = async (id) => {
        if (window.confirm("¿Seguro que deseas eliminar este proveedor?")) {
            await deleteDoc(doc(db, "empresas", id));
        }
    };

    const resetForm = () => {
        setFormData({ nombreComercial: '', tipo: 'Operadora', rfc: '', contactoNombre: '', correoB2B: '', telefono: '', sitioWeb: '', notas: '' });
        setEditingId(null);
        setShowModal(false);
    };

    const openEdit = (emp) => {
        setFormData(emp);
        setEditingId(emp.id);
        setShowModal(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Directorio B2B</h2>
                <button onClick={() => setShowModal(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 shadow-lg">
                    <Plus size={20} /> Nuevo Socio
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {empresas.map(emp => (
                    <div key={emp.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="bg-indigo-50 p-2 rounded-xl text-indigo-600"><Building2 size={24} /></div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => setViewDetails(emp)} className="p-1.5 text-gray-400 hover:text-blue-600"><Eye size={16} /></button>
                                <button onClick={() => openEdit(emp)} className="p-1.5 text-gray-400 hover:text-amber-600"><Edit3 size={16} /></button>
                                <button onClick={() => handleDelete(emp.id)} className="p-1.5 text-gray-400 hover:text-red-600"><Trash2 size={16} /></button>
                            </div>
                        </div>
                        <h3 className="font-bold text-gray-800 truncate">{emp.nombreComercial}</h3>
                        <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">{emp.tipo}</p>

                        <div className="mt-4 pt-4 border-t border-gray-50 space-y-2">
                            <div className="flex items-center gap-2 text-xs text-gray-500"><Phone size={12} /> {emp.telefono}</div>
                            <div className="flex items-center gap-2 text-xs text-indigo-500 font-medium truncate"><Globe size={12} /> {emp.sitioWeb}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* POPUP DE DETALLES (MÁS DATOS) */}
            {viewDetails && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-end z-[110]">
                    <div className="bg-white h-full w-full max-w-md p-8 shadow-2xl animate-in slide-in-from-right duration-300">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-xl font-black uppercase tracking-tighter">Detalles del Socio</h3>
                            <button onClick={() => setViewDetails(null)} className="p-2 hover:bg-gray-100 rounded-full"><X /></button>
                        </div>
                        <div className="space-y-6">
                            <section>
                                <p className="text-[10px] font-bold text-gray-400 uppercase">Información Fiscal</p>
                                <p className="text-lg font-bold text-slate-800">{viewDetails.nombreComercial}</p>
                                <p className="text-sm text-gray-500">RFC: {viewDetails.rfc || 'No registrado'}</p>
                            </section>
                            <section className="bg-slate-50 p-4 rounded-2xl">
                                <p className="text-[10px] font-bold text-indigo-500 uppercase mb-2">Contacto Directo</p>
                                <p className="font-bold text-slate-700">{viewDetails.contactoNombre}</p>
                                <p className="text-sm text-slate-500">{viewDetails.correoB2B}</p>
                            </section>
                            <section>
                                <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Notas Internas de Evelux</p>
                                <p className="text-sm text-gray-600 italic">"{viewDetails.notas || 'Sin notas adicionales...'}"</p>
                            </section>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL PARA CREAR/EDITAR (Simplificado para el ejemplo) */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[120] p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-y-auto">
                        {/* Header */}
                        <div className="p-4 border-b flex justify-between items-center bg-gray-50 sticky top-0 z-10">
                            <h3 className="text-xl font-bold text-slate-800">Gestión de Empresa / Socio</h3>
                            <button onClick={resetForm} className="text-gray-400 hover:text-red-500 transition-colors text-2xl">✕</button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-10">

                            {/* SECCIÓN 1: DATOS FISCALES */}
                            <section>
                                <div className="flex items-center gap-2 mb-6 border-b pb-2">
                                    <h4 className="text-lg font-bold text-blue-900">Datos Generales y Fiscales</h4>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="md:col-span-1">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Nombre Comercial</label>
                                        <input required className="w-full border-b-2 border-gray-200 focus:border-blue-500 p-2 outline-none transition-all" value={formData.nombreComercial} onChange={e => setFormData({ ...formData, nombreComercial: e.target.value })} />
                                    </div>
                                    <div className="md:col-span-1">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Razón Social</label>
                                        <input className="w-full border-b-2 border-gray-200 focus:border-blue-500 p-2 outline-none transition-all" value={formData.razonSocial} onChange={e => setFormData({ ...formData, razonSocial: e.target.value })} />
                                    </div>
                                    <div className="md:col-span-1">
                                        <label className="text-xs font-bold text-slate-500 uppercase">R.F.C.</label>
                                        <input className="w-full border-b-2 border-gray-200 focus:border-blue-500 p-2 outline-none transition-all" value={formData.rfc} onChange={e => setFormData({ ...formData, rfc: e.target.value })} />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Régimen Fiscal</label>
                                        <select className="w-full border-b-2 border-gray-200 focus:border-blue-500 p-2 outline-none" value={formData.regimenFiscal} onChange={e => setFormData({ ...formData, regimenFiscal: e.target.value })}>
                                            <option value="">Seleccione una opción</option>
                                            <option value="601">General de Ley Personas Morales</option>
                                            <option value="603">Personas Morales con Fines no Lucrativos</option>
                                            <option value="626">Régimen Simplificado de Confianza (RESICO)</option>
                                        </select>
                                    </div>
                                    <div className="md:col-span-1">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Uso de CFDI</label>
                                        <select className="w-full border-b-2 border-gray-200 focus:border-blue-500 p-2 outline-none" value={formData.usoCFDI} onChange={e => setFormData({ ...formData, usoCFDI: e.target.value })}>
                                            <option value="G03">Gastos en General</option>
                                            <option value="P01">Por definir</option>
                                        </select>
                                    </div>
                                </div>
                            </section>

                            {/* SECCIÓN 2: DIRECCIÓN */}
                            <section>
                                <div className="flex items-center gap-2 mb-6 border-b pb-2">
                                    <h4 className="text-lg font-bold text-blue-900">Dirección de la Empresa</h4>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                    <div className="md:col-span-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Calle</label>
                                        <input className="w-full border-b-2 border-gray-200 p-2 outline-none" value={formData.calle} onChange={e => setFormData({ ...formData, calle: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase">Num. Ext</label>
                                        <input className="w-full border-b-2 border-gray-200 p-2 outline-none" value={formData.numExterior} onChange={e => setFormData({ ...formData, numExterior: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase">Num. Int</label>
                                        <input className="w-full border-b-2 border-gray-200 p-2 outline-none" value={formData.numInterior} onChange={e => setFormData({ ...formData, numInterior: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase">Colonia</label>
                                        <input className="w-full border-b-2 border-gray-200 p-2 outline-none" value={formData.colonia} onChange={e => setFormData({ ...formData, colonia: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase">C.P.</label>
                                        <input className="w-full border-b-2 border-gray-200 p-2 outline-none" value={formData.cp} onChange={e => setFormData({ ...formData, cp: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase">Estado</label>
                                        <input className="w-full border-b-2 border-gray-200 p-2 outline-none" value={formData.estado} onChange={e => setFormData({ ...formData, estado: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase">País</label>
                                        <input className="w-full border-b-2 border-gray-200 p-2 outline-none" value={formData.pais} onChange={e => setFormData({ ...formData, pais: e.target.value })} />
                                    </div>
                                </div>
                            </section>

                            {/* SECCIÓN 3: CONTACTO */}
                            <section>
                                <div className="flex items-center gap-2 mb-6 border-b pb-2">
                                    <h4 className="text-lg font-bold text-blue-900">Datos de Contacto</h4>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase">Contacto/Propietario</label>
                                        <input className="w-full border-b-2 border-gray-200 p-2 outline-none font-bold" value={formData.contactoNombre} onChange={e => setFormData({ ...formData, contactoNombre: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase">Nombre Factura</label>
                                        <input className="w-full border-b-2 border-gray-200 p-2 outline-none" value={formData.nombreFactura} onChange={e => setFormData({ ...formData, nombreFactura: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase">Correo Electrónico</label>
                                        <input className="w-full border-b-2 border-gray-200 p-2 outline-none text-blue-600" type="email" value={formData.correoB2B} onChange={e => setFormData({ ...formData, correoB2B: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase">Telefono</label>
                                        <input className="w-full border-b-2 border-gray-200 p-2 outline-none text-blue-600" type="tel" value={formData.telefono} onChange={e => setFormData({ ...formData, telefono: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase">Sitio Web</label>
                                        <input className="w-full border-b-2 border-gray-200 p-2 outline-none text-blue-600" type="text" value={formData.sitioWeb} onChange={e => setFormData({ ...formData, sitioWeb: e.target.value })} />
                                    </div>
                                    <div className="md:col-span-3">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Observaciones</label>
                                        <textarea className="w-full border-b-2 border-gray-200 p-2 outline-none resize-none" rows="2" value={formData.notas} onChange={e => setFormData({ ...formData, notas: e.target.value })}></textarea>
                                    </div>
                                </div>
                            </section>

                            {/* Footer del Formulario */}
                            <div className="flex justify-center pt-8 border-t">
                                <button type="submit" className="bg-blue-600 text-white px-12 py-3 rounded-lg font-bold hover:bg-blue-700 shadow-xl transition-all uppercase tracking-widest">
                                    {editingId ? 'Guardar Cambios' : 'Registrar Empresa'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}