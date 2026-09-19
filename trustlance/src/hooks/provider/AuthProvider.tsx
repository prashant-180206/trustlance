import {
    createContext,
    useContext,
    useEffect,
    useState,
    type ReactNode,
} from "react";

import type { Session, User } from "@supabase/supabase-js";
import { authService } from "../../lib/services/AuthService";

// import { authService } from "@/services";

interface AuthContextValue {
    session: Session | null;
    user: User | null;
    loading: boolean;
    signIn: () => Promise<void>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(
    undefined,
);

export function AuthProvider({
    children,
}: {
    children: ReactNode;
}) {
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;

        authService
            .getSession()
            .then((session) => {
                if (mounted) {
                    setSession(session);
                }
            })
            .finally(() => {
                if (mounted) {
                    setLoading(false);
                }
            });

        const {
            data: { subscription },
        } = authService.onAuthStateChange(
            async (_event, session) => {
                setSession(session);
            },
        );

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    const signIn = async () => {
        await authService.signInWithWallet();
    };

    const signOut = async () => {
        await authService.signOut();
        setSession(null);
    };

    return (
        <AuthContext.Provider
            value={{
                session,
                user: session?.user ?? null,
                loading,
                signIn,
                signOut,
            }
            }
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error(
            "useAuth must be used inside AuthProvider",
        );
    }

    return context;
}