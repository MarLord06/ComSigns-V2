(globalThis.TURBOPACK = globalThis.TURBOPACK || []).push(["static/chunks/lib_a5e2fe88._.js", {

"[project]/lib/supabase.ts [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "supabase": (()=>supabase)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$module$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@supabase/supabase-js/dist/module/index.js [app-client] (ecmascript) <locals>");
;
const supabaseUrl = ("TURBOPACK compile-time value", "https://xqdlbbwavnmkewvjaget.supabase.co");
const supabaseAnonKey = ("TURBOPACK compile-time value", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxZGxiYndhdm5ta2V3dmphZ2V0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwOTUxNjksImV4cCI6MjA2ODY3MTE2OX0.MRfDvIbM8zOEwTj6muzZTzeNwWoQ-TfjzExjMIabLs4");
if ("TURBOPACK compile-time falsy", 0) {
    "TURBOPACK unreachable";
}
if ("TURBOPACK compile-time falsy", 0) {
    "TURBOPACK unreachable";
}
const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$module$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["createClient"])(supabaseUrl, supabaseAnonKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
    }
});
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/lib/auth-context.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "AuthProvider": (()=>AuthProvider),
    "useAuth": (()=>useAuth)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/supabase.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
'use client';
;
;
const AuthContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createContext"])(undefined);
const useAuth = ()=>{
    _s();
    const context = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useContext"])(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
_s(useAuth, "b9L3QQ+jgeyIrH0NfHrJ8nn7VMU=");
const AuthProvider = ({ children })=>{
    _s1();
    const [user, setUser] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [session, setSession] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [profile, setProfile] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [stats, setStats] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const [isNewUser, setIsNewUser] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AuthProvider.useEffect": ()=>{
            // Obtener sesión inicial
            __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].auth.getSession().then({
                "AuthProvider.useEffect": ({ data: { session } })=>{
                    setSession(session);
                    setUser(session?.user ?? null);
                    if (session?.user) {
                        loadUserProfile(session.user.id);
                        loadUserStats(session.user.id);
                    }
                    setLoading(false);
                }
            }["AuthProvider.useEffect"]);
            // Escuchar cambios de autenticación
            const { data: { subscription } } = __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].auth.onAuthStateChange({
                "AuthProvider.useEffect": async (event, session)=>{
                    setSession(session);
                    setUser(session?.user ?? null);
                    if (session?.user) {
                        await loadUserProfile(session.user.id);
                        await loadUserStats(session.user.id);
                        // Verificar si es un usuario nuevo
                        if (event === 'SIGNED_IN' && !profile) {
                            setIsNewUser(true);
                        }
                    } else {
                        setProfile(null);
                        setStats(null);
                        setIsNewUser(false);
                    }
                    setLoading(false);
                }
            }["AuthProvider.useEffect"]);
            return ({
                "AuthProvider.useEffect": ()=>subscription.unsubscribe()
            })["AuthProvider.useEffect"];
        }
    }["AuthProvider.useEffect"], []);
    const loadUserProfile = async (userId)=>{
        try {
            const { data, error } = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].from('profiles').select('*').eq('id', userId).single();
            if (error && error.code !== 'PGRST116') {
                console.error('Error loading profile:', error);
                return;
            }
            setProfile(data);
        } catch (error) {
            console.error('Error loading profile:', error);
        }
    };
    const loadUserStats = async (userId)=>{
        try {
            // Crear una sesión de usuario si no existe
            let sessionId = userId; // Por ahora usar userId como sessionId
            // Obtener estadísticas directamente de Supabase
            const { data: statsData, error } = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].from('practice_results').select('score, accuracy, total_time_seconds').eq('session_id', sessionId);
            if (error) {
                console.log('No stats yet, using defaults:', error);
            }
            // Calcular estadísticas o usar datos mock
            const stats = statsData && statsData.length > 0 ? {
                total_sessions: statsData.length,
                total_practice_time: statsData.reduce((sum, result)=>sum + result.total_time_seconds, 0),
                letters_completed: [],
                average_accuracy: statsData.reduce((sum, result)=>sum + result.accuracy, 0) / statsData.length,
                current_streak: 0,
                best_streak: 0,
                total_points: statsData.reduce((sum, result)=>sum + result.score, 0),
                level: Math.floor(statsData.reduce((sum, result)=>sum + result.score, 0) / 100) + 1
            } : {
                total_sessions: 0,
                total_practice_time: 0,
                letters_completed: [],
                average_accuracy: 0,
                current_streak: 0,
                best_streak: 0,
                total_points: 0,
                level: 1
            };
            setStats(stats);
            console.log('Stats loaded successfully:', stats);
        } catch (error) {
            console.error('Error loading stats:', error);
            // Datos por defecto para usuarios nuevos
            setStats({
                total_sessions: 0,
                total_practice_time: 0,
                letters_completed: [],
                average_accuracy: 0,
                current_streak: 0,
                best_streak: 0,
                total_points: 0,
                level: 1
            });
        }
    };
    const signIn = async (email, password)=>{
        try {
            console.log('Attempting login for:', email);
            const { data, error } = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].auth.signInWithPassword({
                email,
                password
            });
            if (error) {
                console.error('Login error:', error);
                // Manejar errores específicos
                if (error.message.includes('Email not confirmed')) {
                    console.error('Email needs confirmation');
                    return {
                        error: {
                            ...error,
                            message: 'Confirma tu email antes de iniciar sesión'
                        }
                    };
                }
                if (error.message.includes('Invalid login credentials')) {
                    console.error('Invalid credentials');
                    return {
                        error: {
                            ...error,
                            message: 'Email o contraseña incorrectos'
                        }
                    };
                }
                return {
                    error
                };
            }
            console.log('Login successful:', data.user?.email);
            return {
                error: null
            };
        } catch (err) {
            console.error('Unexpected login error:', err);
            return {
                error: err
            };
        }
    };
    const signUp = async (email, password, username, fullName, experienceLevel)=>{
        try {
            const { data, error } = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].auth.signUp({
                email,
                password,
                options: {
                    data: {
                        username,
                        full_name: fullName,
                        experience_level: experienceLevel
                    }
                }
            });
            if (error) {
                console.error('Auth signup error:', error);
                return {
                    error
                };
            }
            if (!data.user) {
                console.error('No user data returned');
                return {
                    error: new Error('No user data returned')
                };
            }
            // Crear perfil en la tabla profiles
            const { error: profileError } = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].from('profiles').insert({
                id: data.user.id,
                username,
                full_name: fullName,
                experience_level: experienceLevel
            });
            if (profileError) {
                console.error('Error creating profile:', profileError);
                // Si es un error de tabla no existe, dar un mensaje más claro
                if (profileError.code === '42P01') {
                    console.error('La tabla profiles no existe. Ejecuta el schema de Supabase.');
                    return {
                        error: new Error('Database not configured. Please contact support.')
                    };
                }
                return {
                    error: profileError
                };
            }
            console.log('User and profile created successfully');
            return {
                error: null
            };
        } catch (err) {
            console.error('Unexpected signup error:', err);
            return {
                error: err
            };
        }
    };
    const signOut = async ()=>{
        const { error } = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].auth.signOut();
        if (error) {
            console.error('Error signing out:', error);
        }
    };
    const updateProfile = async (updates)=>{
        if (!user) return {
            error: new Error('No user logged in')
        };
        try {
            const { error } = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].from('profiles').update(updates).eq('id', user.id);
            if (!error) {
                setProfile((prev)=>prev ? {
                        ...prev,
                        ...updates
                    } : null);
            }
            return {
                error
            };
        } catch (error) {
            return {
                error: error
            };
        }
    };
    const refreshStats = async ()=>{
        if (user) {
            await loadUserStats(user.id);
        }
    };
    const value = {
        user,
        session,
        profile,
        stats,
        loading,
        signIn,
        signUp,
        signOut,
        updateProfile,
        refreshStats,
        isNewUser
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(AuthContext.Provider, {
        value: value,
        children: children
    }, void 0, false, {
        fileName: "[project]/lib/auth-context.tsx",
        lineNumber: 288,
        columnNumber: 10
    }, this);
};
_s1(AuthProvider, "lwDfsLdRW/6/wGUBs4jMHIbUJ8M=");
_c = AuthProvider;
var _c;
__turbopack_context__.k.register(_c, "AuthProvider");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
}]);

//# sourceMappingURL=lib_a5e2fe88._.js.map