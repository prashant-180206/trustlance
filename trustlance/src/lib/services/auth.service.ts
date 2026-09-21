// import { supabase } from "@/supabase/client";

import { supabase } from "../supabase/client";

export class AuthService {
    async signInWithWallet(accountType: "freelancer" | "company") {
        const { data, error } = await supabase.auth.signInWithWeb3({
            chain: "ethereum",
            statement:
                "Sign in to TrustLance. By signing this message, you agree to the TrustLance Terms of Service.",
        });

        if (error) {
            throw error;
        }

        const user = data.user;

        if (!user) {
            throw new Error("Wallet authentication succeeded but no user was returned.");
        }

        const walletAddress = data.user.user_metadata?.custom_claims?.address;

        if (!walletAddress) {
            throw new Error("Wallet address not found.");
        }

        const { error: profileError } = await supabase
            .from("profiles")
            .upsert(
                {
                    id: user.id,
                    wallet_address: walletAddress,
                    account_type: accountType,
                },
                {
                    onConflict: "id",
                }
            );

        if (profileError) {
            throw profileError;
        }

        return {
            data, accountType
        };
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