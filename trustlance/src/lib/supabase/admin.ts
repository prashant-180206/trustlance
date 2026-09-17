"use server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database.types";

let adminClient: SupabaseClient<Database> | null = null;

/**
 * Server-only Supabase client using the service role key.
 * It bypasses RLS, so it MUST never be imported from client components.
 */
export function getAdminClient(): SupabaseClient<Database> {
  if (adminClient) return adminClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey || serviceRoleKey.startsWith("your_")) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY. Add your Supabase service_role (secret) key " +
        "to trustlance/.env.local. Never expose it with a NEXT_PUBLIC_ prefix.",
    );
  }

  adminClient = createClient<Database>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return adminClient;
}