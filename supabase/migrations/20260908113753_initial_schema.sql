SET local check_function_bodies = off;

CREATE TABLE "public"."auth_nonces" (
  "wallet_address" text                     NOT NULL,
  "nonce"          text                     NOT NULL,
  "expires_at"     timestamp with time zone NOT NULL,
  "created_at"     timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "auth_nonces_pkey" PRIMARY KEY (wallet_address)
);

CREATE TABLE "public"."dao_votes" (
  "id"         uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "dispute_id" uuid                     NOT NULL,
  "voter_id"   uuid                     NOT NULL,
  "vote"       text                     NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "dao_votes_dispute_id_voter_id_key" UNIQUE (dispute_id, voter_id),
  CONSTRAINT "dao_votes_pkey" PRIMARY KEY (id),
  CONSTRAINT "dao_votes_vote_check" CHECK ((vote = ANY (ARRAY['client'::text, 'freelancer'::text])))
);

CREATE TABLE "public"."disputes" (
  "id"                   uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "milestone_id"         uuid                     NOT NULL,
  "raised_by"            uuid                     NOT NULL,
  "reason"               text                     NOT NULL,
  "voting_start"         timestamp with time zone,
  "voting_end"           timestamp with time zone,
  "votes_for_client"     integer                  NOT NULL DEFAULT 0,
  "votes_for_freelancer" integer                  NOT NULL DEFAULT 0,
  "resolution_tx_hash"   text,
  "resolved_at"          timestamp with time zone,
  "created_at"           timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "disputes_milestone_id_key" UNIQUE (milestone_id),
  CONSTRAINT "disputes_pkey" PRIMARY KEY (id)
);

CREATE TABLE "public"."files" (
  "id"          uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "cid"         text                     NOT NULL,
  "uploader_id" uuid                     NOT NULL,
  "related_id"  uuid                     NOT NULL,
  "file_name"   text                     NOT NULL,
  "file_size"   bigint                   NOT NULL,
  "mime_type"   text                     NOT NULL,
  "created_at"  timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "files_pkey" PRIMARY KEY (id)
);

CREATE TABLE "public"."milestones" (
  "id"                      uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "project_id"              uuid                     NOT NULL,
  "order_index"             integer                  NOT NULL,
  "description"             text                     NOT NULL,
  "deliverable_expectation" text,
  "amount"                  numeric(38,18)           NOT NULL,
  "deliverable_cid"         text,
  "submitted_at"            timestamp with time zone,
  "approved_at"             timestamp with time zone,
  "rejected_at"             timestamp with time zone,
  "paid_tx_hash"            text,
  "created_at"              timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "milestones_pkey" PRIMARY KEY (id),
  CONSTRAINT "milestones_project_id_order_index_key" UNIQUE (project_id, order_index)
);

CREATE TABLE "public"."notifications" (
  "id"         uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "user_id"    uuid                     NOT NULL,
  "type"       text                     NOT NULL,
  "message"    text                     NOT NULL,
  "related_id" uuid,
  "is_read"    boolean                  NOT NULL DEFAULT false,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "notifications_pkey" PRIMARY KEY (id)
);

CREATE TABLE "public"."profiles" (
  "id"              uuid                     NOT NULL,
  "wallet_address"  text                     NOT NULL,
  "role"            text                     NOT NULL DEFAULT 'freelancer'::text,
  "display_name"    text,
  "bio"             text,
  "avatar_cid"      text,
  "did_verified"    boolean                  NOT NULL DEFAULT false,
  "did_verified_at" timestamp with time zone,
  "skills"          text[]                   DEFAULT '{}'::text[],
  "is_suspended"    boolean                  NOT NULL DEFAULT false,
  "created_at"      timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"      timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "profiles_pkey" PRIMARY KEY (id),
  CONSTRAINT "profiles_role_check" CHECK ((role = ANY (ARRAY['client'::text, 'freelancer'::text, 'admin'::text]))),
  CONSTRAINT "profiles_wallet_address_check" CHECK ((wallet_address = lower(wallet_address))),
  CONSTRAINT "profiles_wallet_address_key" UNIQUE (wallet_address)
);

CREATE TABLE "public"."projects" (
  "id"                    uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "client_id"             uuid                     NOT NULL,
  "title"                 text                     NOT NULL,
  "description"           text                     NOT NULL,
  "category"              text                     NOT NULL,
  "skills"                text[]                   DEFAULT '{}'::text[],
  "budget_amount"         numeric(38,18)           NOT NULL,
  "budget_token"          text                     NOT NULL DEFAULT 'MATIC'::text,
  "deadline"              date,
  "contract_address"      text,
  "escrow_funded_tx"      text,
  "awarded_freelancer_id" uuid,
  "created_at"            timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"            timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "projects_pkey" PRIMARY KEY (id)
);

CREATE TABLE "public"."proposals" (
  "id"                uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "project_id"        uuid                     NOT NULL,
  "freelancer_id"     uuid                     NOT NULL,
  "cover_message"     text                     NOT NULL,
  "proposed_timeline" text,
  "proposed_amount"   numeric(38,18),
  "created_at"        timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "proposals_pkey" PRIMARY KEY (id),
  CONSTRAINT "proposals_project_id_freelancer_id_key" UNIQUE (project_id, freelancer_id)
);

CREATE TABLE "public"."transactions" (
  "id"           uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "project_id"   uuid                     NOT NULL,
  "milestone_id" uuid,
  "tx_hash"      text                     NOT NULL,
  "amount"       numeric(38,18),
  "from_address" text                     NOT NULL,
  "to_address"   text                     NOT NULL,
  "block_number" bigint                   NOT NULL,
  "status"       text                     NOT NULL DEFAULT 'confirmed'::text,
  "created_at"   timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "transactions_pkey" PRIMARY KEY (id),
  CONSTRAINT "transactions_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'confirmed'::text, 'failed'::text]))),
  CONSTRAINT "transactions_tx_hash_key" UNIQUE (tx_hash)
);

CREATE TYPE "public"."dispute_status" AS ENUM (
  'open',
  'voting',
  'resolved_client',
  'resolved_freelancer'
);

ALTER TABLE "public"."disputes"
  ADD COLUMN "status" public.dispute_status NOT NULL DEFAULT 'open'::public.dispute_status;

CREATE TYPE "public"."file_related_type" AS ENUM (
  'milestone_deliverable',
  'dispute_evidence',
  'avatar',
  'profile_document'
);

ALTER TABLE "public"."files"
  ADD COLUMN "related_type" public.file_related_type NOT NULL;

CREATE TYPE "public"."milestone_status" AS ENUM (
  'pending',
  'submitted',
  'approved',
  'rejected',
  'disputed',
  'paid'
);

ALTER TABLE "public"."milestones"
  ADD COLUMN "status" public.milestone_status NOT NULL DEFAULT 'pending'::public.milestone_status;

CREATE TYPE "public"."project_status" AS ENUM (
  'draft',
  'open',
  'awarded',
  'in_progress',
  'completed',
  'cancelled',
  'disputed'
);

ALTER TABLE "public"."projects"
  ADD COLUMN "status" public.project_status NOT NULL DEFAULT 'draft'::public.project_status;

CREATE TYPE "public"."proposal_status" AS ENUM (
  'submitted',
  'accepted',
  'rejected',
  'withdrawn'
);

ALTER TABLE "public"."proposals"
  ADD COLUMN "status" public.proposal_status NOT NULL DEFAULT 'submitted'::public.proposal_status;

CREATE TYPE "public"."tx_type" AS ENUM (
  'escrow_funded',
  'milestone_paid',
  'refund',
  'dispute_resolution'
);

ALTER TABLE "public"."transactions"
  ADD COLUMN "tx_type" public.tx_type NOT NULL;

CREATE OR REPLACE FUNCTION public.after_vote_cast()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  AS $function$
begin
  if (select status from public.disputes where id = new.dispute_id) != 'voting' then
    raise exception 'voting window is not open';
  end if;

  if new.vote = 'client' then
    update public.disputes set votes_for_client = votes_for_client + 1 where id = new.dispute_id;
  else
    update public.disputes set votes_for_freelancer = votes_for_freelancer + 1 where id = new.dispute_id;
  end if;
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  AS $function$
begin
  insert into public.profiles (id, wallet_address)
  values (new.id, lower(new.raw_user_meta_data->>'wallet_address'));
  return new;
end;
$function$;

ALTER TABLE "public"."dao_votes"
  ADD CONSTRAINT "dao_votes_dispute_id_fkey" FOREIGN KEY (dispute_id) REFERENCES public.disputes(id) ON DELETE CASCADE;

ALTER TABLE "public"."disputes"
  ADD CONSTRAINT "disputes_milestone_id_fkey" FOREIGN KEY (milestone_id) REFERENCES public.milestones(id);

ALTER TABLE "public"."profiles"
  ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."dao_votes"
  ADD CONSTRAINT "dao_votes_voter_id_fkey" FOREIGN KEY (voter_id) REFERENCES public.profiles(id);

ALTER TABLE "public"."disputes"
  ADD CONSTRAINT "disputes_raised_by_fkey" FOREIGN KEY (raised_by) REFERENCES public.profiles(id);

ALTER TABLE "public"."files"
  ADD CONSTRAINT "files_uploader_id_fkey" FOREIGN KEY (uploader_id) REFERENCES public.profiles(id);

ALTER TABLE "public"."notifications"
  ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE "public"."projects"
  ADD CONSTRAINT "projects_awarded_freelancer_id_fkey" FOREIGN KEY (awarded_freelancer_id) REFERENCES public.profiles(id);

ALTER TABLE "public"."projects"
  ADD CONSTRAINT "projects_client_id_fkey" FOREIGN KEY (client_id) REFERENCES public.profiles(id);

ALTER TABLE "public"."milestones"
  ADD CONSTRAINT "milestones_project_id_fkey" FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;

ALTER TABLE "public"."proposals"
  ADD CONSTRAINT "proposals_freelancer_id_fkey" FOREIGN KEY (freelancer_id) REFERENCES public.profiles(id);

ALTER TABLE "public"."proposals"
  ADD CONSTRAINT "proposals_project_id_fkey" FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;

ALTER TABLE "public"."transactions"
  ADD CONSTRAINT "transactions_milestone_id_fkey" FOREIGN KEY (milestone_id) REFERENCES public.milestones(id);

ALTER TABLE "public"."transactions"
  ADD CONSTRAINT "transactions_project_id_fkey" FOREIGN KEY (project_id) REFERENCES public.projects(id);

CREATE INDEX idx_disputes_status ON public.disputes USING btree (status);

CREATE INDEX idx_files_related ON public.files USING btree (related_type, related_id);

CREATE INDEX idx_milestones_project ON public.milestones USING btree (project_id);

CREATE INDEX idx_milestones_status ON public.milestones USING btree (status);

CREATE INDEX idx_notifications_user ON public.notifications USING btree (user_id, is_read);

CREATE INDEX idx_profiles_wallet ON public.profiles USING btree (wallet_address);

CREATE INDEX idx_projects_category ON public.projects USING btree (category);

CREATE INDEX idx_projects_client ON public.projects USING btree (client_id);

CREATE INDEX idx_projects_status ON public.projects USING btree (status);

CREATE INDEX idx_proposals_freelancer ON public.proposals USING btree (freelancer_id);

CREATE INDEX idx_proposals_project ON public.proposals USING btree (project_id);

CREATE INDEX idx_transactions_project ON public.transactions USING btree (project_id);

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER trg_after_vote_cast
  AFTER INSERT ON public.dao_votes
  FOR EACH ROW
  EXECUTE FUNCTION public.after_vote_cast();

GRANT EXECUTE ON FUNCTION "public"."after_vote_cast"() TO PUBLIC, "anon", "authenticated", "postgres", "service_role";

GRANT EXECUTE ON FUNCTION "public"."handle_new_user"() TO PUBLIC, "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."auth_nonces" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."dao_votes" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."disputes" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."files" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."milestones" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."notifications" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."profiles" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."projects" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."proposals" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."transactions" TO "anon", "authenticated", "postgres", "service_role";

GRANT USAGE ON TYPE "public"."dispute_status" TO "postgres";

GRANT USAGE ON TYPE "public"."file_related_type" TO "postgres";

GRANT USAGE ON TYPE "public"."milestone_status" TO "postgres";

GRANT USAGE ON TYPE "public"."project_status" TO "postgres";

GRANT USAGE ON TYPE "public"."proposal_status" TO "postgres";

GRANT USAGE ON TYPE "public"."tx_type" TO "postgres";
