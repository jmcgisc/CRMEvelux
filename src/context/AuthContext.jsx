import { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../firebaseConfig';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, setDoc, getDoc, collection, query, where, getDocs, serverTimestamp } from 'firebase/firestore';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    // null = sin error | { correo } = acceso denegado
    const [accesoDenegado, setAccesoDenegado] = useState(null);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                try {
                    // ── 1. Verificar si el correo existe en la colección "empleados" ──
                    const qEmpleados = query(
                        collection(db, 'empleados'),
                        where('correo', '==', firebaseUser.email)
                    );
                    const empleadoSnap = await getDocs(qEmpleados);

                    if (empleadoSnap.empty) {
                        // Correo NO autorizado → cerrar sesión y mostrar aviso
                        setAccesoDenegado({ correo: firebaseUser.email });
                        await signOut(auth);
                        setUser(null);
                        setLoading(false);
                        return;
                    }

                    // ── 2. Correo autorizado → obtener datos del empleado ─────────────
                    const empleadoData = empleadoSnap.docs[0].data();

                    // ── 3. Guardar / actualizar registro en colección "users" ──────────
                    const userRef = doc(db, 'users', firebaseUser.uid);
                    const snap = await getDoc(userRef);

                    const userData = {
                        uid: firebaseUser.uid,
                        nombre: firebaseUser.displayName || firebaseUser.email.split('@')[0],
                        correo: firebaseUser.email,
                        foto: firebaseUser.photoURL || null,
                        proveedor: firebaseUser.providerData?.[0]?.providerId || 'password',
                        ultimoAcceso: serverTimestamp(),
                    };

                    if (!snap.exists()) {
                        await setDoc(userRef, {
                            ...userData,
                            fechaAlta: serverTimestamp(),
                            rol: empleadoData.rol || 'Ventas',
                            estatus: 'Activo',
                        });
                    } else {
                        await setDoc(userRef, userData, { merge: true });
                    }

                    // ── 4. Combinar datos de auth + empleados (rol, permisos, meta…) ──
                    setAccesoDenegado(null);
                    setUser({
                        uid: firebaseUser.uid,
                        ...userData,
                        // Datos del empleado tienen prioridad (rol, permisos, meta, estatus)
                        nombre: empleadoData.nombre || userData.nombre,
                        rol: empleadoData.rol || 'Ventas',
                        puesto: empleadoData.puesto || '',
                        meta: empleadoData.meta || 0,
                        estatus: empleadoData.estatus || 'Activo',
                        permisos: empleadoData.permisos || {},
                    });
                } catch (error) {
                    console.error("Error al obtener datos de Firebase (Posible error de reglas de seguridad):", error);
                    setAccesoDenegado({
                        correo: firebaseUser.email,
                        motivo: "Error de permisos de Firestore: verifica que las Reglas de Seguridad no hayan expirado en la Consola de Firebase."
                    });
                    await signOut(auth);
                    setUser(null);
                }
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return () => unsub();
    }, []);

    const logout = () => signOut(auth);

    // Limpiar estado de acceso denegado (para volver a intentar con otro correo)
    const limpiarError = () => setAccesoDenegado(null);

    return (
        <AuthContext.Provider value={{ user, loading, logout, accesoDenegado, limpiarError }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
