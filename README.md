# Sistema de Rondas - Capacitor Edition 🛡️

Sistema de gestión y monitoreo de rondas de seguridad en tiempo real. Este proyecto ha sido migrado de Expo a un stack web moderno utilizando **Vite**, **React** y **Capacitor** para ofrecer una experiencia nativa fluida en Android e iOS utilizando tecnologías web de alto rendimiento.

## 🚀 Tecnologías Principales

*   **Frontend**: [React 19](https://react.dev/) + [Vite](https://vitejs.dev/) (Configurado como ES Modules).
*   **Móvil**: [Capacitor 6+](https://capacitorjs.com/) para acceso a APIs nativas (Geolocalización, Cámara).
*   **Backend & DB**: [Firebase](https://firebase.google.com/) (Authentication & Cloud Firestore).
*   **Mapas**: [Leaflet](https://leafletjs.com/) + [React Leaflet](https://react-leaflet.js.org/).
*   **Diseño**: [Styled Components](https://styled-components.com/) para una UI Premium y [Lucide React](https://lucide.dev/) para iconografía.
*   **Escáner**: [Html5-QRCode](https://github.com/mebjas/html5-qrcode) para lectura de puntos de marcación.

## ✨ Funcionalidades

### 🔐 Sistema de Autenticación
*   **Tres Perfiles de Usuario**:
    *   **Guardia**: Acceso exclusivo a la realización de rondas, escaneo de puntos y visualización de su ubicación.
    *   **Administrador**: Control total. Creación de usuarios, gestión de permisos y visualización de reportes detallados.
    *   **Director(a)**: Acceso de solo lectura a los reportes y actividades de los guardias.

### 📍 Monitoreo en Tiempo Real
*   Tracking de geolocalización persistente durante la ronda.
*   Visualización de recorridos realizados en mapas interactivos mediante Leaflet.
*   Marcado de puntos de control mediante escaneo de códigos de barras/QR.

### 📊 Gestión y Reportes
*   Historial detallado de todas las marcaciones (Punto, Guardia, Fecha y Hora).
*   Panel de administración para gestión de usuarios sincronizado con Firebase Auth.

## 🛠️ Instalación y Desarrollo

1.  **Instalar dependencias**:
    ```bash
    npm install
    ```

2.  **Correr en modo desarrollo (Web)**:
    ```bash
    npm run dev
    ```

3.  **Compilar y sincronizar con Android**:
    ```bash
    npm run build
    ```
    ```bash
    npx cap sync
    ```

4.  **Abrir en Android Studio**:
    ```bash
    npx cap open android
    ```

## 📁 Estructura del Proyecto

*   `src/context/`: Lógica global (Auth, Ubicación).
*   `src/screens/`: Pantallas de la aplicación (Home, Login, Map, etc.).
*   `src/config/`: Configuraciones de Firebase y plugins.
*   `android/`: Proyecto nativo generado por Capacitor.
*   `expo-backup/`: Respaldo del código original antes de la migración.

---
Desarrollado con ❤️ para la gestión de seguridad inteligente.
