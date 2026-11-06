# Ámbar Steak House — Menú interactivo 2.5D

Experiencia web construida con React, Vite y Three.js a partir de las tres fotografías entregadas.

## Qué incluye

- Tres platos seleccionables desde una lista y con flechas laterales.
- Visor WebGL con fotografía sobre una superficie curva y un respaldo con grosor metálico para dar sensación de volumen.
- Giro con mouse o dedo, zoom con rueda, botones +/− y zoom por pellizco en pantallas táctiles.
- Giro automático que se puede pausar y botón para reiniciar la vista.
- Partículas de vapor animadas delante del plato.
- Diseño adaptable a computador y celular.

## Ejecutar en tu computador

Necesitas Node.js 22 o superior.

```bash
npm install
npm run dev
```

Abre la dirección local que muestre Vite (normalmente `http://localhost:5173`).

Para generar los archivos de publicación:

```bash
npm run build
```

La carpeta lista para publicar será `dist/`.


## Publicar en GitHub Pages (recomendado)

Este proyecto ya está configurado con rutas relativas para funcionar dentro de la URL del repositorio (por ejemplo, `https://usuario.github.io/nombre-del-repositorio/`). También incluye el flujo `.github/workflows/deploy.yml`.

1. Sube **todo el contenido** de esta carpeta al repositorio, incluida la carpeta `.github`. No subas únicamente `src/` ni publiques el código fuente como si fuera el sitio compilado.
2. En GitHub abre **Settings → Pages**.
3. En **Build and deployment → Source**, selecciona **GitHub Actions**.
4. En la pestaña **Actions**, espera a que termine correctamente el flujo **Deploy React app to GitHub Pages**.
5. Abre la URL que muestra **Settings → Pages**.

Cada cambio que envíes a `main` o `master` volverá a compilar y publicar la aplicación. Si tu rama principal tiene otro nombre, cambia ese nombre en `.github/workflows/deploy.yml`.

### Si todavía aparece en blanco

- Revisa que la acción de GitHub termine en verde.
- Abre la página, pulsa `F12` y revisa **Console** y **Network**; un `404` de archivos JS o de imágenes suele indicar que no se publicó `dist/` o que faltó algún archivo.
- Comprueba que `public/images/` contenga las tres imágenes `.webp` y que se hayan subido al repositorio.

## Personalizar platos

Edita el arreglo `dishes` en `src/App.jsx`. Cada registro usa:

- `name`: nombre del plato.
- `category`: categoría del menú.
- `description`: descripción comercial.
- `image`: ruta de la fotografía dentro de `public/images/`.
- `accent`: tono de luz ambiental en el visor.

Sustituye las fotografías dentro de `public/images/` y conserva las rutas o actualiza `image`.

## Importante sobre el 3D

Las imágenes fuente son fotografías 2D de una sola vista. Este proyecto implementa un visor **2.5D**: la foto se aplica a una malla curva con respaldo y grosor, por lo que puede girarse y verse en perspectiva, pero no contiene geometría real de los ingredientes ni una parte posterior reconstruida. Para obtener modelos 3D completos y precisos se necesitarían fotografías desde varios ángulos o modelos 3D creados mediante fotogrametría/modelado.

## Conexión con Supabase

La app lee los platos de la tabla `menu3d_dishes` del proyecto `https://evfvcvllsjlakrpqmvdj.supabase.co` (configurado en `.env` y `src/lib/supabase.js`).

1. En Supabase abre **SQL Editor** y ejecuta `supabase/menu3d_dishes.sql`. Crea la tabla, la política de lectura pública y los tres platos iniciales.
2. Para agregar o editar platos usa **Table Editor → menu3d_dishes**. `image_url` acepta una URL completa (por ejemplo, de Supabase Storage) o una ruta dentro de `public/`, como `images/ambar-burger.webp`.
3. Si la tabla no existe o está vacía, la app muestra los tres platos incluidos, así que nunca queda en blanco.
