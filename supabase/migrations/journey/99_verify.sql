-- 99 · Verification. Run last; every query should return rows.

-- 1) Seven tables
select table_name
  from information_schema.tables
 where table_schema = 'public' and table_name like 'journey%'
 order by table_name;

-- 2) Helper functions
select proname from pg_proc where proname in ('is_admin','journey_touch') order by proname;

-- 3) Foreign keys
select tc.table_name, kcu.column_name, ccu.table_name as references_table
  from information_schema.table_constraints tc
  join information_schema.key_column_usage kcu on kcu.constraint_name = tc.constraint_name
  join information_schema.constraint_column_usage ccu on ccu.constraint_name = tc.constraint_name
 where tc.constraint_type = 'FOREIGN KEY' and tc.table_name like 'journey%'
 order by tc.table_name;

-- 4) Indexes
select tablename, indexname from pg_indexes
 where schemaname = 'public' and tablename like 'journey%' order by tablename, indexname;

-- 5) Check constraints
select conname from pg_constraint where conname like 'journey%ck' order by conname;

-- 6) Triggers
select trigger_name, event_object_table from information_schema.triggers
 where trigger_name like 'journey%' order by trigger_name;

-- 7) RLS enabled on all seven
select relname, relrowsecurity from pg_class
 where relname like 'journey%' and relkind = 'r' order by relname;

-- 8) Policies
select tablename, policyname, cmd from pg_policies
 where tablename like 'journey%' order by tablename, policyname;

-- 9) Seeded roadmaps
select plan, count(*) as stages from public.journey_stages group by plan order by plan;
select s.plan, count(st.id) as steps
  from public.journey_stages s join public.journey_steps st on st.stage_id = s.id
 group by s.plan order by s.plan;

-- 10) Make the API notice the new tables
notify pgrst, 'reload schema';
