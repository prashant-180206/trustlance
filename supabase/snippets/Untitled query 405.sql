-- Grant usage on public schema and all tables to postgres
grant usage on schema public to postgres, anon, authenticated, service_role;
grant all privileges on all tables in schema public to postgres, anon, authenticated, service_role;

delete from auth.users;