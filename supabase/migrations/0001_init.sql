-- RayGrass: esquema inicial
-- Cliente -> Parques (lugares) -> Trabajos; Pagos por cliente (opcionalmente ligados a un trabajo); Gastos.

create table public.clientes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  nombre text not null check (length(trim(nombre)) > 0),
  telefono text,
  notas text,
  created_at timestamptz not null default now()
);

create table public.parques (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  cliente_id uuid not null references public.clientes on delete cascade,
  nombre text not null check (length(trim(nombre)) > 0),
  tipo text not null default 'quinta' check (tipo in ('quinta','cancha','parque','terreno','otro')),
  direccion text,
  precio numeric(12,2) not null default 0 check (precio >= 0),
  tamano_m2 integer check (tamano_m2 > 0),
  tiempo_min integer check (tiempo_min > 0),
  notas text,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

-- tipo 'corte' = corte de pasto (cuenta para frecuencia); 'particular' = otros trabajos
create table public.trabajos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  cliente_id uuid not null references public.clientes on delete cascade,
  parque_id uuid references public.parques on delete restrict,
  tipo text not null default 'corte' check (tipo in ('corte','particular')),
  fecha date not null default current_date,
  descripcion text,
  importe numeric(12,2) not null check (importe >= 0),
  created_at timestamptz not null default now(),
  constraint corte_con_parque check (tipo <> 'corte' or parque_id is not null)
);

-- trabajo_id null = pago "a cuenta": se aplica a los trabajos impagos más viejos del cliente
create table public.pagos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  cliente_id uuid not null references public.clientes on delete cascade,
  trabajo_id uuid references public.trabajos on delete cascade,
  fecha date not null default current_date,
  monto numeric(12,2) not null check (monto > 0),
  notas text,
  created_at timestamptz not null default now()
);

create table public.gastos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  fecha date not null default current_date,
  categoria text not null check (categoria in ('combustible','reparacion','repuestos','empleado','otros')),
  monto numeric(12,2) not null check (monto > 0),
  descripcion text,
  created_at timestamptz not null default now()
);

create index on public.clientes (user_id);
create index on public.parques (cliente_id);
create index on public.trabajos (cliente_id, fecha);
create index on public.trabajos (parque_id, fecha);
create index on public.pagos (cliente_id, fecha);
create index on public.pagos (trabajo_id);
create index on public.gastos (user_id, fecha);

-- RLS: cada usuario ve solo lo suyo
do $$
declare t text;
begin
  foreach t in array array['clientes','parques','trabajos','pagos','gastos'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format($p$create policy "propios" on public.%I for all to authenticated
      using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()))$p$, t);
  end loop;
end $$;

-- Estado de pago de cada trabajo: pagos ligados + pagos a cuenta aplicados del más viejo al más nuevo
create view public.trabajos_estado with (security_invoker = true) as
with ligados as (
  select trabajo_id, sum(monto) as s from public.pagos where trabajo_id is not null group by trabajo_id
), a_cuenta as (
  select cliente_id, sum(monto) as s from public.pagos where trabajo_id is null group by cliente_id
), base as (
  select t.*,
         least(t.importe, coalesce(l.s, 0)) as pagado_directo,
         greatest(t.importe - coalesce(l.s, 0), 0) as resto
  from public.trabajos t left join ligados l on l.trabajo_id = t.id
), acum as (
  select b.*,
         coalesce(sum(b.resto) over (partition by b.cliente_id order by b.fecha, b.created_at, b.id
                                     rows between unbounded preceding and 1 preceding), 0) as resto_previo
  from base b
)
select a.id, a.user_id, a.cliente_id, a.parque_id, a.tipo, a.fecha, a.descripcion, a.importe, a.created_at,
       a.pagado_directo + least(a.resto, greatest(coalesce(c.s, 0) - a.resto_previo, 0)) as pagado,
       a.importe - (a.pagado_directo + least(a.resto, greatest(coalesce(c.s, 0) - a.resto_previo, 0))) as saldo
from acum a left join a_cuenta c on c.cliente_id = a.cliente_id;

grant select on public.trabajos_estado to authenticated;
