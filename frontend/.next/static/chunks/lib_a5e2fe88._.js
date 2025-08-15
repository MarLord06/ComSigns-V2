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
const supabaseUrl = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!supabaseUrl) {
    throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL');
}
if (!supabaseAnonKey) {
    throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY');
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
    // Un usuario es nuevo si no tiene estadísticas o tiene 0 sesiones
    const [isNewUser, setIsNewUser] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AuthProvider.useEffect": ()=>{
            console.log('Initializing auth...');
            // Obtener sesión inicial
            const getSession = {
                "AuthProvider.useEffect.getSession": async ()=>{
                    const { data: { session }, error } = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].auth.getSession();
                    if (error) {
                        console.error('Error getting session:', error);
                        setLoading(false);
                        return;
                    }
                    console.log('Initial session:', session ? 'Found' : 'Not found');
                    setSession(session);
                    setUser(session?.user ?? null);
                    if (session?.user) {
                        console.log('User found, loading profile and stats...');
                        await loadUserProfile(session.user.id);
                        await loadUserStats(session.user.id);
                    }
                    setLoading(false);
                    console.log('Auth initialization complete');
                }
            }["AuthProvider.useEffect.getSession"];
            getSession();
            // Escuchar cambios de autenticación
            const { data: { subscription } } = __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].auth.onAuthStateChange({
                "AuthProvider.useEffect": async (event, session)=>{
                    console.log('Auth state changed:', event);
                    setSession(session);
                    setUser(session?.user ?? null);
                    if (session?.user) {
                        console.log('Loading user data...');
                        loadUserProfile(session.user.id) // Quitar await para evitar bloqueos
                        ;
                        loadUserStats(session.user.id) // Quitar await para evitar bloqueos
                        ;
                    } else {
                        setProfile(null);
                        setStats(null);
                        setIsNewUser(false);
                    }
                    setLoading(false);
                }
            }["AuthProvider.useEffect"]);
            return ({
                "AuthProvider.useEffect": ()=>{
                    subscription.unsubscribe();
                }
            })["AuthProvider.useEffect"];
        }
    }["AuthProvider.useEffect"], []) // Dependencias vacías para ejecutar solo una vez
    ;
    const loadUserProfile = async (userId)=>{
        try {
            console.log('Loading profile for user:', userId);
            const { data, error } = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].from('user_profiles').select('*').eq('id', userId).maybeSingle();
            if (error) {
                console.error('Error loading profile:', error);
                // Si hay error grave, limpiar sesión
                if (error.code === '42P01' || error.message.includes('does not exist')) {
                    console.log('Forcing logout due to profile error');
                    await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].auth.signOut();
                }
                return;
            }
            if (!data) {
                console.log('No profile found for user, user might have been deleted');
                // Usuario eliminado, limpiar sesión
                await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].auth.signOut();
                return;
            }
            console.log('Profile data:', data);
            setProfile(data);
        } catch (error) {
            console.error('Error loading profile:', error);
            // En caso de error, limpiar sesión para evitar loops
            await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].auth.signOut();
        }
    };
    const loadUserStats = async (userId)=>{
        try {
            console.log('Loading stats for user:', userId);
            // Obtener estadísticas de game_attempts (nueva estructura simplificada)
            const { data: attemptsData, error } = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].from('game_attempts').select('points_earned, is_correct, time_taken_seconds').eq('user_id', userId);
            if (error) {
                console.log('No stats yet, using defaults:', error);
                // Establecer stats por defecto
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
                setIsNewUser(true);
                return;
            }
            console.log('Attempts data:', attemptsData);
            // Calcular estadísticas o usar datos mock
            if (attemptsData && attemptsData.length > 0) {
                const correctAttempts = attemptsData.filter((a)=>a.is_correct);
                const stats = {
                    total_sessions: attemptsData.length,
                    total_practice_time: attemptsData.reduce((sum, result)=>sum + (result.time_taken_seconds || 0), 0),
                    letters_completed: [],
                    average_accuracy: correctAttempts.length / attemptsData.length,
                    current_streak: 0,
                    best_streak: 0,
                    total_points: attemptsData.reduce((sum, result)=>sum + (result.points_earned || 0), 0),
                    level: Math.floor(attemptsData.reduce((sum, result)=>sum + (result.points_earned || 0), 0) / 100) + 1
                };
                setStats(stats);
                setIsNewUser(stats.total_sessions === 0);
                console.log('Stats loaded successfully:', stats);
            } else {
                // Usuario nuevo sin estadísticas
                const defaultStats = {
                    total_sessions: 0,
                    total_practice_time: 0,
                    letters_completed: [],
                    average_accuracy: 0,
                    current_streak: 0,
                    best_streak: 0,
                    total_points: 0,
                    level: 1
                };
                setStats(defaultStats);
                setIsNewUser(true);
                console.log('Using default stats for new user');
            }
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
                if (error.message.includes('Email not confirmed')) {
                    console.error('Email needs confirmation');
                    return {
                        error: {
                            name: 'AuthError',
                            message: 'Confirma tu email antes de iniciar sesión',
                            status: 400,
                            code: 'email_not_confirmed',
                            __isAuthError: true
                        }
                    };
                }
                if (error.message.includes('Invalid login credentials')) {
                    console.error('Invalid credentials');
                    return {
                        error: {
                            name: 'AuthError',
                            message: 'Email o contraseña incorrectos',
                            status: 400,
                            code: 'invalid_login',
                            __isAuthError: true
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
                error: {
                    name: 'AuthError',
                    message: err instanceof Error ? err.message : 'Unknown error',
                    status: 400,
                    code: 'unexpected',
                    __isAuthError: true
                }
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
                    error: {
                        name: 'AuthError',
                        message: 'No user data returned',
                        status: 400,
                        code: 'no_user',
                        __isAuthError: true
                    }
                };
            }
            // Crear perfil en la tabla user_profiles
            const { error: profileError } = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].from('user_profiles').insert({
                id: data.user.id,
                username,
                full_name: fullName,
                experience_level: experienceLevel
            });
            if (profileError) {
                console.error('Error creating profile:', profileError);
                if (profileError.code === '42P01') {
                    console.error('La tabla profiles no existe. Ejecuta el schema de Supabase.');
                    return {
                        error: {
                            name: 'AuthError',
                            message: 'Database not configured. Please contact support.',
                            status: 500,
                            code: 'db_not_configured',
                            __isAuthError: true
                        }
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
                error: {
                    name: 'AuthError',
                    message: err instanceof Error ? err.message : 'Unknown error',
                    status: 400,
                    code: 'unexpected',
                    __isAuthError: true
                }
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
            const { error } = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].from('user_profiles').update(updates).eq('id', user.id);
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
    // Marcar tutorial como completado: simplemente refresca stats para que isNewUser se actualice
    const completeTutorial = async ()=>{
        if (user) {
            await refreshStats();
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
        isNewUser,
        completeTutorial
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(AuthContext.Provider, {
        value: value,
        children: children
    }, void 0, false, {
        fileName: "[project]/lib/auth-context.tsx",
        lineNumber: 383,
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