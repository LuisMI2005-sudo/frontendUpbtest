# UPB Productos · Frontend

Interfaz de inventario en español conectada al backend Express/PostgreSQL de Render. HTML, CSS y JavaScript nativos, sin dependencias de ejecución ni claves privadas.

## Funciones

- Listado y resumen de productos, unidades y valor del stock.
- Búsqueda por nombre a través del backend.
- Consulta de detalles por id.
- Creación, edición y eliminación con confirmación.
- Validación de formularios, estados de carga, errores de conexión y diseño adaptable.

La moneda de presentación es Bs. El backend conserva los valores numéricos.

## Conexión

`src/api.js` contiene únicamente la URL pública: https://backendupbtest-969u.onrender.com.

| Acción | Método y ruta |
| --- | --- |
| Listar | GET /api/productos |
| Buscar | GET /api/productos?nombre=texto |
| Detalle | GET /api/productos/:id |
| Crear | POST /api/productos |
| Editar | PUT /api/productos/:id |
| Eliminar | DELETE /api/productos/:id |

Los datos se guardan en PostgreSQL mediante el backend. Las credenciales de la base nunca se incluyen en el frontend. Cada modificación afecta al catálogo compartido.

## Publicación en Render

Crear un **Static Site** conectado a este repositorio, rama `main`.

- Build Command: `npm run build`
- Publish Directory: `dist`

No necesita variables de entorno. El backend permite peticiones desde el navegador mediante CORS.

## Revisión de código y vista previa

Node 22 o posterior. `npm run check` revisa la sintaxis; `npm run build` prepara los archivos estáticos. `npm run dev` sirve una vista previa en http://127.0.0.1:4173, siempre conectada al backend de Render. El sitio publicado no depende de que esa vista previa esté encendida.

## Entrega académica

Entregar el enlace de este repositorio, el repositorio del backend y la URL pública del frontend publicada en Render.
