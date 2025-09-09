# Inventario Corporativo

![Pantalla de inicio](https://i.imgur.com/TUa3148.png)

## Descripción

**Inventario Corporativo** es una aplicación web moderna y robusta construida con Next.js, diseñada para la gestión eficiente del inventario de equipos dentro de una organización. Permite un seguimiento detallado de los activos, su estado, ubicación y usuarios asignados.

La aplicación cuenta con un sistema de autenticación seguro que restringe el acceso solo al personal autorizado, garantizando la integridad de los datos.

## Características Principales

- **Gestión de Inventario:** Crea, edita, elimina y visualiza equipos del inventario.
- **Dashboard Interactivo:** Visualiza estadísticas clave del inventario de un vistazo.
- **Búsqueda y Filtrado:** Encuentra equipos rápidamente con filtros por estado, departamento y más.
- **Autenticación Segura:** Inicio de sesión con Google (OAuth 2.0) a través de `next-auth`.
- **Acceso Restringido:** Solo los usuarios en una lista blanca (whitelist) pueden acceder a la aplicación.
- **Interfaz Moderna:** Construida con [Shadcn/ui](https://ui.shadcn.com/) y Tailwind CSS para una experiencia de usuario limpia y responsiva.

---

## Instalación y Configuración

Sigue estos pasos para levantar el proyecto en un entorno de desarrollo local.

### 1. Prerrequisitos

- [Node.js](https://nodejs.org/) (versión 18 o superior)
- [Git](https://git-scm.com/)

### 2. Clonar el Repositorio

```bash
git clone https://github.com/ismaiars/inventario-corporativo.git
cd inventario-corporativo
```

### 3. Instalar Dependencias

```bash
npm install
```

### 4. Configurar Variables de Entorno

Este proyecto utiliza variables de entorno para gestionar las claves de la API y otras configuraciones sensibles.

1.  Crea un archivo `.env.local` en la raíz del proyecto. Puedes duplicar el archivo `.env.example`:
    ```bash
    cp env.example .env.local
    ```

2.  Abre el archivo `.env.local` y añade los siguientes valores:

    ```env
    # Credenciales de Google para OAuth
    # Obtén las tuyas desde la Google Cloud Console
    GOOGLE_CLIENT_ID="TU_ID_DE_CLIENTE"
    GOOGLE_CLIENT_SECRET="TU_SECRETO_DE_CLIENTE"

    # Clave secreta para NextAuth.js
    # Genera una con: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
    NEXTAUTH_SECRET="TU_CLAVE_SECRETA"

    # URL de la aplicación (para desarrollo)
    NEXTAUTH_URL="http://localhost:3000"

    # Lista de correos autorizados para acceder (separados por comas)
    ALLOWED_USERS="correo1@tuempresa.com,correo2@tuempresa.com"
    ```

    **Importante:** Asegúrate de configurar correctamente los **URIs de redireccionamiento autorizados** en tus credenciales de Google Cloud a `http://localhost:3000/api/auth/callback/google`.

### 5. Iniciar el Servidor de Desarrollo

```bash
npm run dev
```

¡Abre [http://localhost:3000](http://localhost:3000) en tu navegador y verás la aplicación en funcionamiento!

## Scripts Disponibles

- `npm run dev`: Inicia el servidor en modo de desarrollo.
- `npm run build`: Compila la aplicación para producción.
- `npm run start`: Inicia la aplicación en modo de producción (después de compilar).
- `npm run lint`: Ejecuta el linter para revisar la calidad del código.

---

Desarrollado con ❤️ por [Tu Nombre](https://github.com/TU_USUARIO).
