# El-Atelier-Secreto

App movil y tablet de lectura local construida con `Expo`, `React Native` y `Expo Router`, en JavaScript.

## Stack

- Expo + React Native
- Expo Router
- React Query
- Zustand
- SQLite local
- Expo Document Picker + File System

## Arranque

```bash
npm install
npx expo start
```

Para abrir directamente:

- `a`: Android
- `i`: iOS
- `w`: Web de previsualizacion

## Enfoque actual

- Entrada directa, sin registro ni login
- Biblioteca local en el dispositivo como fuente principal
- Importacion de carpetas o archivos para poblar la biblioteca
- Busqueda ligera por titulo, autor y categorias amplias
- Navegacion pensada para Android movil y tablet

## Estructura

- `app/`: rutas y pantallas
- `components/`: UI reutilizable
- `constants/`: tema y datos mock
- `hooks/`: logica de busqueda, descargas y biblioteca local
- `lib/`: helpers locales de biblioteca y archivos
- `store/`: estado global con Zustand

## Estado actual

- Pestañas `Descubrir`, `Recientes` y `Biblioteca`
- Lector y detalle de libro
- Indexacion local con SQLite
- Renderizado limitado para listas grandes
- Categorias amplias preparadas para bibliotecas grandes
