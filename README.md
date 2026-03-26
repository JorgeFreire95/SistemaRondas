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

### 💼 Perfiles de Monitoreo (Supervisor & Cliente)
*   **Acceso a Reportes**: Ambos roles pueden visualizar el historial de rondas y generar **Reportes PDF** profesionales.
*   **Seguimiento de Guardias**: Vista de "solo lectura" de la gestión de personal para monitorear quién está "EN RONDA" y ver su ubicación en el mapa.
*   **Gestión Administrativa**: Los Administradores cuentan con pantallas dedicadas para registrar y asignar supervisores y clientes a sus respectivas instalaciones.

### ⚙️ Perfil Administrador (Control Total)
*   **Rondas Administrativas**: Facultad para realizar rondas en cualquier instalación seleccionando manualmente el horario y controlando el inicio/término.
*   **Generación de Reportes PDF**: Sistema avanzado de reportes con filtros por fecha, instalación y usuario, incluyendo **atribución automática de roles** (Adm., Superv., Cli., Guardia).
*   **Configuración Global**: CRUD completo de instalaciones, puntos de marcaje, horarios y gestión unificada de personal y usuarios.
*   **Monitoreo en Tiempo Real**: 
    *   **Estado de Guardia**: Indicadores visuales ("EN RONDA") y mapa en vivo con seguimiento geoespacial.

### 🏢 Gestión Avanzada de Instalaciones y Secciones
*   **Organización por Secciones**: Creación opcional de "Secciones" dentro de cada instalación (ej. Pisos, Zonas).
*   **Asignación Inteligente**: Guardias y puntos de marcaje vinculados a secciones específicas para un control estructurado.
*   **Filtro Contextual**: Los guardias solo visualizan los puntos y horarios pertinentes a la sección que se les asignó, mejorando la concentración y eficiencia.

### 🔐 Seguridad y Rendimiento
*   **Prevención de Auto-Login**: Aislamiento de sesiones con una instancia secundaria de Firebase Auth para asegurar que los administradores no pierdan su sesión al crear nuevos usuarios.
*   **Control de Eliminación**: Expulsión automática e inmediata (Logout) del sistema si un rol de seguridad borra el perfil de usuario en la base de datos de manera administrativa.
*   **Cierre de Sesión Automático**: Persistencia de sesión robusta (`browserSessionPersistence`) y manejo seguro de cierre de procesos.
*   **Protección Contra Doble Envío**: Estados de carga y bloqueos en botones de registro para evitar registros duplicados por error de red o interfaz.
*   **Rutas Protegidas**: Sistema de navegación seguro que valida roles antes de permitir el acceso a secciones críticas.

## 🛠️ Instalación y Desarrollo

1.  **Instalar dependencias**: `npm install`
2.  **Modo desarrollo (Web)**: `npm run dev`
3.  **Sincronización Android**: `npm run build && npx cap sync`
4.  **Abrir Android Studio**: `npx cap open android`

## 📁 Estructura del Proyecto

*   `src/context/`: Lógica centralizada (`AuthContext`, `LocationContext`).
*   `src/screens/`:
    *   `HomeScreen.jsx`: Dashboard dinámico multinivel.
    *   `AdminRoundsScreen.jsx` & `AdminSchedulesScreen.jsx`: Selección y ejecución de rondas administrativas.
    *   `ReportsScreen.jsx` & `PDFScreen.jsx`: Historial visual y motor de generación de reportes PDF.
    *   `SupervisorsScreen.jsx` & `ClientsScreen.jsx`: Gestión de roles de monitoreo.
    *   `GuardsScreen.jsx`: Gestión de personal y monitoreo de estado.
    *   `MapScreen.jsx`: Monitoreo geoespacial en vivo.
    *   `ScannerScreen.jsx`: Visor de cámara para escaneo rápido.
*   `src/config/`: Conexión de Firebase y estilos globales.

---
Desarrollado con ❤️ para la gestión de seguridad inteligente.
