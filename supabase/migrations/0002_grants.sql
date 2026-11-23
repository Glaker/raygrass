-- Permisos de tabla para usuarios logueados (RLS sigue filtrando por user_id). anon no recibe nada.
grant usage on schema public to authenticated;
grant select, insert, update, delete on public.clientes, public.parques, public.trabajos, public.pagos, public.gastos to authenticated;
grant select on public.trabajos_estado to authenticated;
revoke all on public.clientes, public.parques, public.trabajos, public.pagos, public.gastos, public.trabajos_estado from anon;
