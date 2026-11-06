-- Ejecuta este script en Supabase → SQL Editor.
-- Crea la tabla de platos del menú 3D con lectura pública (solo lectura).

create table if not exists public.menu3d_dishes (
  id          bigint generated always as identity primary key,
  name        text not null,
  category    text,
  description text,
  image_url   text not null,          -- URL completa (p. ej. Supabase Storage) o ruta como 'images/ambar-burger.webp'
  price       text,
  accent      text default '#e8a33e', -- color de luz del visor
  sort_order  int  default 0,
  active      boolean default true,
  created_at  timestamptz default now()
);

alter table public.menu3d_dishes enable row level security;

grant select on public.menu3d_dishes to anon, authenticated;

drop policy if exists "Lectura pública de platos activos" on public.menu3d_dishes;
create policy "Lectura pública de platos activos"
  on public.menu3d_dishes for select
  to anon, authenticated
  using (active = true);

-- Datos iniciales (los mismos tres platos incluidos en la app)
insert into public.menu3d_dishes (name, category, description, image_url, price, accent, sort_order)
select * from (values
  ('Ámbar Burger', 'De la casa', 'Carne a la parrilla, queso fundido, tocineta y pan dorado. Una hamburguesa para disfrutar sin afán.', 'images/ambar-burger.webp', 'Consulta en el restaurante', '#e8a33e', 1),
  ('Panceta crocante', 'Entradas', 'Panceta dorada y crujiente sobre una base cremosa de aguacate, terminada con cebolla encurtida.', 'images/panceta-crocante.webp', 'Consulta en el restaurante', '#c79a4c', 2),
  ('Steak al romero', 'Cortes a la parrilla', 'Corte de res sellado a la parrilla, acompañado de romero fresco y salsa de hierbas.', 'images/steak-romero.webp', 'Consulta en el restaurante', '#a77c44', 3)
) as v(name, category, description, image_url, price, accent, sort_order)
where not exists (select 1 from public.menu3d_dishes);
