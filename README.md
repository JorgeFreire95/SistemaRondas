# Sistema de Rondas - Capacitor Edition 🛡️

Sistema de gestión y monitoreo de rondas de seguridad en tiempo real. Este proyecto ha sido migrado de Expo a un stack web moderno utilizando **Vite**, **React 19** y **Capacitor 6** para ofrecer una experiencia nativa fluida en Android e iOS utilizando tecnologías web de alto rendimiento.

## 🚀 Tecnologías Principales

*   **Frontend**: [React 19](https://react.dev/) + [Vite](https://vitejs.dev/) (Configurado como ES Modules).
*   **Móvil**: [Capacitor 6+](https://capacitorjs.com/) para acceso a APIs nativas (Geolocalización, Cámara).
*   **Backend & DB**: [Firebase](https://firebase.google.com/) (Authentication & Cloud Firestore).
*   **Mapas**: [Leaflet](https://leafletjs.com/) + [React Leaflet](https://react-leaflet.js.org/).
*   **Diseño**: [Styled Components](https://styled-components.com/) para una UI Premium y [Lucide React](https://lucide.dev/) para iconografía.
*   **Escáner**: [Html5-QRCode](https://github.com/mebjas/html5-qrcode) optimizado para Códigos QR y de Barras.

## ✨ Funcionalidades Destacadas

### 👮 Perfil Guardia (Rondas Inteligentes)
*   **Dashboard Simplificado**: Visualización clara de la instalación asignada y horarios de ronda en tiempo real.
*   **Rondas por Horario**: Selección de horario específico que guía al guardia a través de una lista de puntos.
*   **Escaneo con Preguntas**: Cada punto de marcaje puede incluir una pregunta de verificación (ej: "¿Bodega cerrada?") que debe responderse antes de completar el escaneo.
*   **Seguimiento GPS**: Tracking automático durante la ronda para registrar el recorrido exacto.

### ⚙️ Perfil Administrador (Control Total)
*   **Gestión de Instalaciones**: Creación, edición y eliminación de instalaciones.
*   **Configuración de Puntos**: Registro de puntos de marcaje vinculando nombres con códigos QR/Barras específicos.
*   **Gestión de Horarios**: Asignación de bloques horarios de ronda para cada instalación.
*   **Gestión de Guardias**: Registro completo de guardias (email, RUT, nombre) y asignación a instalaciones.
*   **Monitoreo en Tiempo Real**: 
    *   **Estado de Guardia**: Indicadores visuales con puntos pulsantes ("EN RONDA") en la lista de guardias.
    *   **Mapa en Vivo**: Visualización en tiempo real de la ubicación de todos los guardias activos sobre el mapa.

### 🔐 Seguridad y Rendimiento
*   **Cierre de Sesión Automático**: Si la aplicación se cierra de forma forzosa (Force Close), la sesión se borra automáticamente para mayor seguridad (`browserSessionPersistence`).
*   **Manejo de Errores Silencioso**: Control robusto de permisos de Firestore para evitar errores de consola durante el cierre de sesión.

## 🛠️ Instalación y Desarrollo

1.  **Instalar dependencias**: `npm install`
2.  **Modo desarrollo (Web)**: `npm run dev`
3.  **Sincronización Android**: `npm run build && npx cap sync android`
4.  **Abrir Android Studio**: `npx cap open android`

## 📁 Estructura del Proyecto

*   `src/context/`: Lógica centralizada (`AuthContext`, `LocationContext`).
*   `src/screens/`:
    *   `HomeScreen.jsx`: Dashboard dinámico según el perfil.
    *   `RoundScreen.jsx`: Ejecución de rondas y checklist de puntos.
    *   `ScannerScreen.jsx`: Visor de cámara optimizada para escaneo rápido.
    *   `InstallationsScreen.jsx`: CRUD de instalaciones y configuración.
    *   `GuardsScreen.jsx`: Gestión de personal y monitoreo de estado.
    *   `MapScreen.jsx`: Monitoreo geoespacial en vivo.
*   `src/config/`: Conexión de Firebase y estilos globales.

---
Desarrollado con ❤️ para la gestión de seguridad inteligente.
