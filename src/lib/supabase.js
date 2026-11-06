import { createClient } from '@supabase/supabase-js';

// La llave "publishable" es pública por diseño (se envía al navegador);
// la seguridad la dan las políticas RLS de la base de datos.
const url = import.meta.env.VITE_SUPABASE_URL || 'https://evfvcvllsjlakrpqmvdj.supabase.co';
const key = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_eULSc0LoT39KdFjD1eJiyQ_hQV5MotS';

export const supabase = createClient(url, key, {
  auth: { persistSession: false },
});

const base = import.meta.env.BASE_URL;

// Convierte la ruta guardada en la base de datos a una URL utilizable.
function resolveImage(value) {
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  return `${base}${value.replace(/^\/+/, '')}`;
}

/**
 * Lee los platos de la tabla `menu3d_dishes`.
 * Devuelve null si la tabla no existe, está vacía o no hay permiso,
 * para que la app use los platos incluidos.
 */
export async function fetchDishes() {
  const { data, error } = await supabase
    .from('menu3d_dishes')
    .select('id, name, category, description, image_url, price, accent, sort_order')
    .eq('active', true)
    .order('sort_order', { ascending: true });

  if (error) {
    console.warn('[Supabase] No se pudieron cargar los platos, se usan los locales:', error.message);
    return null;
  }
  const dishes = (data || [])
    .map((row) => ({
      id: String(row.id),
      name: row.name,
      category: row.category || '',
      description: row.description || '',
      image: resolveImage(row.image_url),
      price: row.price || 'Consulta en el restaurante',
      accent: row.accent || '#e8a33e',
    }))
    .filter((dish) => dish.name && dish.image);

  return dishes.length ? dishes : null;
}
