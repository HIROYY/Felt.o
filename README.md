# Felt.O — Apoyo Emocional & Psicología Clínica 🐾

Aplicación web de acompañamiento emocional y supervisión psicológica clínica construida con React, TypeScript, Tailwind CSS y Vite.

---

## 🚀 Cómo ejecutar el proyecto en LOCAL

> ⚠️ **Importante:** Esta es una aplicación de React + TypeScript construida con Vite. **No se debe abrir el archivo `index.html` haciendo doble clic desde el explorador de archivos**, porque los navegadores no pueden ejecutar archivos `.tsx` de TypeScript directamente ni cargar módulos ES locales por seguridad (CORS en protocolo `file://`).

### Pasos para iniciar en tu computadora:

1. **Abre tu terminal** (PowerShell, CMD, Git Bash o Terminal) en la carpeta del proyecto.
2. **Instala las dependencias:**
   ```bash
   npm install
   ```
3. **Inicia el servidor de desarrollo:**
   ```bash
   npm run dev
   ```
4. **Abre tu navegador** en:
   ```
   http://localhost:3000
   ```
   ¡Listo! Verás la aplicación funcionando al 100% con modo claro/oscuro, chat de Felt.O y triage clínico.

---

## 🌐 Cómo hacer que funcione en GitHub Pages

GitHub Pages por defecto busca servir archivos HTML estáticos y **no compila TypeScript automáticamente** a menos que uses una de las siguientes 2 opciones:

### Opción 1: Automático con GitHub Actions (Recomendada)
Ya dejamos configurado el archivo `.github/workflows/deploy.yml`:
1. Sube tus cambios a GitHub (`git add .`, `git commit -m "deploy"`, `git push`).
2. En tu repositorio de GitHub, ve a **Settings** (Configuración) -> **Pages** (pestaña izquierda).
3. En **Build and deployment** -> **Source**, cambia de *"Deploy from a branch"* a **"GitHub Actions"**.
4. ¡Listo! En 1 minuto tu página estará activa en `https://hiroyy.github.io/Felt.o/`.

### Opción 2: Usar la carpeta `/docs` (Inmediata)
Ya dejamos creada la carpeta `/docs` con la versión compilada:
1. En GitHub, ve a **Settings** -> **Pages**.
2. En **Source**, deja *"Deploy from a branch"*.
3. En **Branch**, selecciona **`main`** (o `master`) y en la carpeta selecciona **/docs** en lugar de `/ (root)`.
4. Haz clic en **Save** (Guardar).
