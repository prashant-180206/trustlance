// import { supabase } from "@/supabase/client";

import { supabase } from "../supabase/client";

export class AuthService {
    async signInWithWallet() {
        const { data, error } = await supabase.auth.signInWithWeb3({
            chain: "ethereum",
            statement:
                "Sign in to TrustLance. By signing this message, you agree to the TrustLance Terms of Service.",
        });

        if (error) {
            throw error;
        }

        console.log("Sign-in data:", data);

        return data;
    }

    async signOut() {
        const { error } = await supabase.auth.signOut();

        if (error) {
            throw error;
        }
    }

    async getSession() {
        const { data, error } = await supabase.auth.getSession();

        if (error) {
            throw error;
        }

        return data.session;
    }

    async getUser() {
        const { data, error } = await supabase.auth.getUser();

        if (error) {
            throw error;
        }

        return data.user;
    }

    onAuthStateChange(
        callback: Parameters<typeof supabase.auth.onAuthStateChange>[0],
    ) {
        return supabase.auth.onAuthStateChange(callback);
    }
}

export const authService = new AuthService();