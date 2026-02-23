import { useState } from 'react';
import { auth, googleProvider } from '../firebaseConfig';
import { signInWithPopup } from 'firebase/auth';
import { LogIn } from 'lucide-react';

export default function Login() {
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const loginGoogle = async () => {
        setError('');
        setLoading(true);
        try {
            await signInWithPopup(auth, googleProvider);
            // AuthContext detecta el login y verifica contra "empleados"
        } catch (err) {
            const msgs = {
                'auth/popup-closed-by-user': 'Se cerró la ventana. Intenta de nuevo.',
                'auth/network-request-failed': 'Sin conexión a internet.',
                'auth/cancelled-popup-request': 'Solicitud cancelada. Intenta de nuevo.',
            };
            setError(msgs[err.code] || 'Ocurrió un error. Intenta de nuevo.');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 relative overflow-hidden">

            {/* Fondo decorativo */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-blue-600/10 blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-blue-800/10 blur-3xl" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-blue-700/5 blur-3xl" />
            </div>

            <div className="relative w-full max-w-sm px-4">

                {/* Brand */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-blue-600 shadow-2xl shadow-blue-600/50 mb-5">
                        <LogIn className="text-white" size={34} />
                    </div>
                    <h1 className="text-4xl font-black text-white tracking-tight">EVELUX</h1>
                    <p className="text-blue-300/50 text-xs font-bold uppercase tracking-[0.3em] mt-1">CRM · Sistema interno</p>
                </div>

                {/* Card */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl p-8 text-center">

                    <p className="text-white/50 text-sm mb-8 leading-relaxed">
                        Acceso exclusivo para colaboradores.<br />
                        Inicia sesión con tu cuenta de Google corporativa.
                    </p>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-semibold rounded-2xl px-4 py-3 mb-5">
                            {error}
                        </div>
                    )}

                    <button
                        onClick={loginGoogle}
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-50 text-slate-700 font-bold py-4 px-6 rounded-2xl transition-all shadow-xl hover:shadow-2xl active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin" />
                        ) : (
                            <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                        )}
                        {loading ? 'Verificando…' : 'Continuar con Google'}
                    </button>

                    <p className="text-white/20 text-[10px] mt-6 uppercase tracking-widest">
                        Solo colaboradores registrados pueden acceder
                    </p>
                </div>

                <p className="text-center text-white/15 text-[10px] mt-6 uppercase tracking-widest">
                    © 2025 Evelux · Todos los derechos reservados
                </p>
            </div>
        </div>
    );
}
