# Referencias UI para El Atelier Secreto

## Objetivo

Traducir patrones solidos de apps de busqueda y lectura de libros a una experiencia propia, mas evocadora visualmente y mas amable de usar.

## Apps revisadas

### 1. Amazon Kindle
- Patron tomado: acciones de lectura y descarga muy visibles en la ficha del libro.
- Patron tomado: continuidad fuerte con secciones tipo "Continue Reading".
- Adaptacion: llevar la accion principal por encima del pliegue y mantener progreso y estado siempre legibles.
- Fuente: [Amazon Kindle en App Store](https://apps.apple.com/us/app/amazon-kindle/id302584613)

### 2. Rakuten Kobo Books
- Patron tomado: mezcla de descubrimiento editorial y biblioteca personal.
- Patron tomado: agrupacion por listas o colecciones faciles de escanear.
- Adaptacion: estanterias tematicas dentro de inicio y biblioteca con nombres emocionales, no solo funcionales.
- Fuente: [Kobo Books en Google Play](https://play.google.com/store/apps/details?id=com.kobobooks.android)

### 3. Apple Books
- Patron tomado: separacion limpia entre explorar, biblioteca y lectura en curso.
- Patron tomado: sensacion de aire y calma en pantallas de lectura y colecciones.
- Adaptacion: fondos claros, espacio negativo y jerarquia tipografica serena.
- Fuente: [Apple Books User Guide](https://support.apple.com/guide/books/welcome/web)

### 4. Google Play Books
- Patron tomado: busqueda inmediata con metadatos utiles y filtros sencillos.
- Patron tomado: presentacion clara de formatos y disponibilidad.
- Adaptacion: barra de busqueda fija arriba y chips tactiles para reducir pasos.
- Fuente: [Google Play Books en Google Play](https://play.google.com/store/apps/details?id=com.google.android.apps.books)

### 5. Goodreads
- Patron tomado: valor social de listas, resenas y afinidad lectora.
- Patron tomado: perfil con actividad reciente en lugar de solo datos estaticos.
- Adaptacion: anadir una capa ligera de actividad e identidad en detalle y perfil, sin contaminar la lectura.
- Fuente: [Goodreads en App Store](https://apps.apple.com/us/app/goodreads-book-reviews/id355833469)

## Estructura de pantallas propuesta

### Acceso
- Hero emocional breve.
- Login y registro en una sola columna.
- Accesos alternativos visibles pero secundarios.

### Descubrir / Buscar
- Busqueda fija en la parte superior.
- Filtros por genero, idioma, tono y formato.
- Bloque de continuidad de lectura.
- Estanterias editoriales y resultados escaneables.

### Detalle del libro
- Portada dominante.
- CTA principal de descargar o leer muestra.
- Sinopsis, datos rapidos, valoraciones y relacionados.

### Lector
- Pagina limpia.
- Controles discretos de tema, tipografia y progreso.
- Marcadores y notas sin romper la inmersion.

### Biblioteca
- Vista por colecciones y por estado.
- Progreso visible en cada libro.
- Recuperacion rapida de lecturas recientes.

### Perfil
- Identidad ligera.
- Resumen de actividad reciente.
- Preferencias de lectura y biblioteca.

## Direccion visual derivada de la portada

### Paleta
- Pergamino: `#f5f0e8`
- Tinta: `#232420`
- Oro envejecido: `#c4a04d`
- Salvia: `#6e8273`
- Lila niebla: `#c6c0d7`
- Aqua magico: `#8fc9d9`

### Principios
- Fondos claros y texturales para mantener legibilidad.
- Oro para acciones, nunca para texto largo.
- Verde salvia y aqua para estado, progreso y elementos "vivos".
- Marcos geometricos inspirados en la portada para dar identidad sin sacrificar claridad.

## Decision de implementacion

Se implemento un prototipo navegable en JavaScript puro para validar:
- lenguaje visual,
- arquitectura de pantallas,
- orden de la informacion,
- y tono general de la experiencia antes de llevarlo a la app final.
