SET local check_function_bodies = off;

CREATE TABLE "public"."applications" (
  "id"              uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "project_id"      uuid                     NOT NULL, 
  "freelancer_id"   uuid                     NOT NULL,
  "proposal"        text,
  "proposed_amount" numeric(36,18),
  "created_at"      timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"      timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "applications_pkey" PRIMARY KEY (id),
  CONSTRAINT "applications_project_freelancer_unique" UNIQUE (project_id, freelancer_id)
);

ALTER TABLE "public"."applications"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."company_profiles" (
  "profile_id"   uuid                     NOT NULL,
  "company_name" text                     NOT NULL,
  "description"  text,
  "industry"     text,
  "website"      text,
  "created_at"   timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"   timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "company_profiles_pkey" PRIMARY KEY (profile_id)
);

ALTER TABLE "public"."company_profiles"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."freelancer_profiles" (
  "profile_id"   uuid                     NOT NULL,
  "headline"     text,
  "bio"          text,
  "experience"   text,
  "hourly_rate"  numeric(36,18),
  "availability" boolean                  NOT NULL DEFAULT true,
  "created_at"   timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"   timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "freelancer_profiles_pkey" PRIMARY KEY (profile_id)
);

ALTER TABLE "public"."freelancer_profiles"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."freelancer_skills" (
  "freelancer_id" uuid NOT NULL,
  "skill_id"      uuid NOT NULL,
  CONSTRAINT "freelancer_skills_pkey" PRIMARY KEY (freelancer_id, skill_id)
);

ALTER TABLE "public"."freelancer_skills"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."profiles" (
  "id"             uuid                     NOT NULL,
  "wallet_address" text                     NOT NULL,
  "display_name"   text,
  "avatar_url"     text,
  "created_at"     timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"     timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "profiles_pkey" PRIMARY KEY (id),
  CONSTRAINT "profiles_wallet_address_key" UNIQUE (wallet_address)
);

ALTER TABLE "public"."profiles"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."project_skills" (
  "project_id" uuid NOT NULL,
  "skill_id"   uuid NOT NULL,
  CONSTRAINT "project_skills_pkey" PRIMARY KEY (project_id, skill_id)
);

ALTER TABLE "public"."project_skills"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."projects" (
  "id"          uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "company_id"  uuid                     NOT NULL,
  "title"       text                     NOT NULL,
  "description" text                     NOT NULL,
  "budget"      numeric(36,18),
  "deadline"    timestamp with time zone,
  "created_at"  timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"  timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "projects_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."projects"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."skills" (
  "id"         uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "name"       text                     NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "skills_name_key" UNIQUE (name),
  CONSTRAINT "skills_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."skills"
  ENABLE ROW LEVEL SECURITY;

CREATE TYPE "public"."account_type" AS ENUM (
  'freelancer',
  'company'
);

ALTER TABLE "public"."profiles"
  ADD COLUMN "account_type" public.account_type NOT NULL;

CREATE TYPE "public"."application_status" AS ENUM (
  'pending',
  'accepted',
  'rejected',
  'withdrawn'
);

ALTER TABLE "public"."applications"
  ADD COLUMN "status" public.application_status NOT NULL DEFAULT 'pending'::public.application_status;

CREATE TYPE "public"."project_status" AS ENUM (
  'draft',
  'open',
  'in_progress',
  'completed',
  'cancelled'
);

ALTER TABLE "public"."projects"
  ADD COLUMN "status" public.project_status NOT NULL DEFAULT 'draft'::public.project_status;

CREATE OR REPLACE FUNCTION public.set_updated_at()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  AS $function$
begin
    new.updated_at = now();
    return new;
end;
$function$;

ALTER TABLE "public"."applications"
  ADD CONSTRAINT "applications_freelancer_id_fkey" FOREIGN KEY (freelancer_id) REFERENCES public.freelancer_profiles(profile_id) ON DELETE CASCADE;

ALTER TABLE "public"."freelancer_skills"
  ADD CONSTRAINT "freelancer_skills_freelancer_id_fkey" FOREIGN KEY (freelancer_id) REFERENCES public.freelancer_profiles(profile_id) ON DELETE CASCADE;

ALTER TABLE "public"."profiles"
  ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."company_profiles"
  ADD CONSTRAINT "company_profiles_profile_id_fkey" FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE "public"."freelancer_profiles"
  ADD CONSTRAINT "freelancer_profiles_profile_id_fkey" FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE "public"."projects"
  ADD CONSTRAINT "projects_company_id_fkey" FOREIGN KEY (company_id) REFERENCES public.company_profiles(profile_id) ON DELETE CASCADE;

ALTER TABLE "public"."applications"
  ADD CONSTRAINT "applications_project_id_fkey" FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;

ALTER TABLE "public"."project_skills"
  ADD CONSTRAINT "project_skills_project_id_fkey" FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;

ALTER TABLE "public"."freelancer_skills"
  ADD CONSTRAINT "freelancer_skills_skill_id_fkey" FOREIGN KEY (skill_id) REFERENCES public.skills(id) ON DELETE CASCADE;

ALTER TABLE "public"."project_skills"
  ADD CONSTRAINT "project_skills_skill_id_fkey" FOREIGN KEY (skill_id) REFERENCES public.skills(id) ON DELETE CASCADE;

CREATE INDEX applications_freelancer_id_idx ON public.applications USING btree (freelancer_id);

CREATE INDEX applications_project_id_idx ON public.applications USING btree (project_id);

CREATE INDEX applications_status_idx ON public.applications USING btree (status);

CREATE INDEX freelancer_profiles_availability_idx ON public.freelancer_profiles USING btree (availability);

CREATE INDEX freelancer_skills_skill_id_idx ON public.freelancer_skills USING btree (skill_id);

CREATE INDEX profiles_account_type_idx ON public.profiles USING btree (account_type);

CREATE INDEX project_skills_skill_id_idx ON public.project_skills USING btree (skill_id);

CREATE INDEX projects_company_id_idx ON public.projects USING btree (company_id);

CREATE INDEX projects_deadline_idx ON public.projects USING btree (deadline);

CREATE INDEX projects_status_idx ON public.projects USING btree (status);

CREATE TRIGGER applications_set_updated_at
  BEFORE UPDATE ON public.applications
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER company_profiles_set_updated_at
  BEFORE UPDATE ON public.company_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER freelancer_profiles_set_updated_at
  BEFORE UPDATE ON public.freelancer_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER projects_set_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "applications_delete_own" ON "public"."applications"
  FOR DELETE
  TO "authenticated"
  USING ((auth.uid() = freelancer_id));

CREATE POLICY "applications_insert_own" ON "public"."applications"
  FOR INSERT
  TO "authenticated"
  WITH CHECK ((auth.uid() = freelancer_id));

CREATE POLICY "applications_select_authenticated" ON "public"."applications"
  FOR SELECT
  TO "authenticated"
  USING (((auth.uid() = freelancer_id) OR (EXISTS ( SELECT 1
   FROM public.projects p
  WHERE ((p.id = applications.project_id) AND (p.company_id = auth.uid()))))));

CREATE POLICY "applications_update_company" ON "public"."applications"
  FOR UPDATE
  TO "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM public.projects p
  WHERE ((p.id = applications.project_id) AND (p.company_id = auth.uid())))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM public.projects p
  WHERE ((p.id = applications.project_id) AND (p.company_id = auth.uid())))));

CREATE POLICY "applications_update_freelancer" ON "public"."applications"
  FOR UPDATE
  TO "authenticated"
  USING ((auth.uid() = freelancer_id))
  WITH CHECK ((auth.uid() = freelancer_id));

CREATE POLICY "company_profiles_delete_own" ON "public"."company_profiles"
  FOR DELETE
  TO "authenticated"
  USING ((auth.uid() = profile_id));

CREATE POLICY "company_profiles_insert_own" ON "public"."company_profiles"
  FOR INSERT
  TO "authenticated"
  WITH CHECK ((auth.uid() = profile_id));

CREATE POLICY "company_profiles_select_authenticated" ON "public"."company_profiles"
  FOR SELECT
  TO "authenticated"
  USING (true);

CREATE POLICY "company_profiles_update_own" ON "public"."company_profiles"
  FOR UPDATE
  TO "authenticated"
  USING ((auth.uid() = profile_id))
  WITH CHECK ((auth.uid() = profile_id));

CREATE POLICY "freelancer_profiles_delete_own" ON "public"."freelancer_profiles"
  FOR DELETE
  TO "authenticated"
  USING ((auth.uid() = profile_id));

CREATE POLICY "freelancer_profiles_insert_own" ON "public"."freelancer_profiles"
  FOR INSERT
  TO "authenticated"
  WITH CHECK ((auth.uid() = profile_id));

CREATE POLICY "freelancer_profiles_select_authenticated" ON "public"."freelancer_profiles"
  FOR SELECT
  TO "authenticated"
  USING (true);

CREATE POLICY "freelancer_profiles_update_own" ON "public"."freelancer_profiles"
  FOR UPDATE
  TO "authenticated"
  USING ((auth.uid() = profile_id))
  WITH CHECK ((auth.uid() = profile_id));

CREATE POLICY "freelancer_skills_delete_own" ON "public"."freelancer_skills"
  FOR DELETE
  TO "authenticated"
  USING ((auth.uid() = freelancer_id));

CREATE POLICY "freelancer_skills_insert_own" ON "public"."freelancer_skills"
  FOR INSERT
  TO "authenticated"
  WITH CHECK ((auth.uid() = freelancer_id));

CREATE POLICY "freelancer_skills_select_authenticated" ON "public"."freelancer_skills"
  FOR SELECT
  TO "authenticated"
  USING (true);

CREATE POLICY "profiles_delete_own" ON "public"."profiles"
  FOR DELETE
  TO "authenticated"
  USING ((auth.uid() = id));

CREATE POLICY "profiles_insert_own" ON "public"."profiles"
  FOR INSERT
  TO "authenticated"
  WITH CHECK ((auth.uid() = id));

CREATE POLICY "profiles_select_public" ON "public"."profiles"
  FOR SELECT
  TO "authenticated"
  USING (true);

CREATE POLICY "profiles_update_own" ON "public"."profiles"
  FOR UPDATE
  TO "authenticated"
  USING ((auth.uid() = id))
  WITH CHECK ((auth.uid() = id));

CREATE POLICY "project_skills_delete_own_project" ON "public"."project_skills"
  FOR DELETE
  TO "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM public.projects p
  WHERE ((p.id = project_skills.project_id) AND (p.company_id = auth.uid())))));

CREATE POLICY "project_skills_insert_own_project" ON "public"."project_skills"
  FOR INSERT
  TO "authenticated"
  WITH CHECK ((EXISTS ( SELECT 1
   FROM public.projects p
  WHERE ((p.id = project_skills.project_id) AND (p.company_id = auth.uid())))));

CREATE POLICY "project_skills_select_authenticated" ON "public"."project_skills"
  FOR SELECT
  TO "authenticated"
  USING (true);

CREATE POLICY "projects_delete_own_company" ON "public"."projects"
  FOR DELETE
  TO "authenticated"
  USING ((auth.uid() = company_id));

CREATE POLICY "projects_insert_own_company" ON "public"."projects"
  FOR INSERT
  TO "authenticated"
  WITH CHECK ((auth.uid() = company_id));

CREATE POLICY "projects_select_authenticated" ON "public"."projects"
  FOR SELECT
  TO "authenticated"
  USING (true);

CREATE POLICY "projects_update_own_company" ON "public"."projects"
  FOR UPDATE
  TO "authenticated"
  USING ((auth.uid() = company_id))
  WITH CHECK ((auth.uid() = company_id));

CREATE POLICY "skills_select_authenticated" ON "public"."skills"
  FOR SELECT
  TO "authenticated"
  USING (true);

GRANT EXECUTE ON FUNCTION "public"."set_updated_at"() TO PUBLIC, "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."applications" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."company_profiles" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."freelancer_profiles" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."freelancer_skills" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."profiles" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."project_skills" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."projects" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."skills" TO "anon", "authenticated", "postgres", "service_role";

GRANT USAGE ON TYPE "public"."account_type" TO "postgres";

GRANT USAGE ON TYPE "public"."application_status" TO "postgres";

GRANT USAGE ON TYPE "public"."project_status" TO "postgres";
