# Sistema de Rondas - Capacitor Edition 🛡️

Sistema de gestión y monitoreo de rondas de seguridad en tiempo real. Este proyecto ha sido migrado de Expo a un stack web moderno utilizando **Vite**, **React 19** y **Capacitor 6** para ofrecer una experiencia nativa fluida en Android e iOS utilizando tecnologías web de alto rendimiento.

## 🚀 Tecnologías Principales

*   **Frontend**: [React 19](https://react.dev/) + [Vite](https://vitejs.dev/) (Configurado como ES Modules).
*   **Móvil**: [Capacitor 6+](https://capacitorjs.com/) para acceso a APIs nativas (Geolocalización, Cámara, FileSystem).
*   **Backend & DB**: [Firebase](https://firebase.google.com/) (Authentication, Cloud Firestore, Firebase Storage).
*   **Mapas**: [Leaflet](https://leafletjs.com/) + [React Leaflet](https://react-leaflet.js.org/).
*   **Diseño**: [Styled Components](https://styled-components.com/) para una UI Premium y [Lucide React](https://lucide.dev/) para iconografía.
*   **Escáner QR / Código de Barras**: Plugin nativo `@capacitor-mlkit/barcode-scanning` y renderización optimizada de galería de dispositivo.

## ✨ Funcionalidades Destacadas

### 👮 Perfil Guardia (Rondas e Ingreso)
*   **Dashboard Simplificado**: Visualización clara de la instalación asignada y horarios de ronda en tiempo real.
*   **Sistema de Asistencia QR**: Nuevo módulo integral de registro de entrada y salida de turno mediante escaneo QR. 
*   **Rondas por Horario**: Selección de horario específico que guía al guardia a través de una lista de puntos.
*   **Escaneo con Evidencia Fotográfica y Preguntas**: Captura de fotos (desde cámara o galería) para evidenciar anomalías o constatar el estado del punto. Cada punto puede incluir una pregunta de verificación (ej: "¿Bodega cerrada?").
*   **Seguimiento GPS**: Tracking automático durante la ronda para registrar el recorrido exacto.

### 💼 Perfiles de Monitoreo (Supervisor & Cliente)
*   **Acceso a Reportes**: Ambos roles pueden visualizar el historial de rondas detallado y generar **Reportes PDF** profesionales.
*   **Seguimiento de Guardias y Asistencia**: Vista de la gestión de personal para monitorear quién está "EN RONDA", su ubicación en el mapa, y su registro de asistencia al turno.
*   **Gestión Administrativa Limitada**: Los Administradores cuentan con pantallas dedicadas para registrar y asignar supervisores y clientes a sus respectivas instalaciones.

### ⚙️ Perfil Administrador (Control Total)
*   **Control de Asistencia del Personal**: Monitoreo de marcajes de entrada y salida de turno de los guardias, asegurando cobertura en las instalaciones.
*   **Rondas Administrativas**: Facultad para realizar rondas (con o sin reanudación) en cualquier instalación seleccionando manualmente el horario y controlando el inicio/término.
*   **Generación de Reportes PDF**: Sistema avanzado de reportes con filtros por fecha, instalación y usuario, incluyendo **atribución automática de roles** (Adm., Superv., Cli., Guardia).
*   **Gestión Unificada**: CRUD completo de instalaciones, puntos de marcaje (con carga de imágenes a Firebase Storage), horarios, secciones y gestión del personal con validación estricta de **RUT chileno** y autogeneración de contraseñas.
*   **Monitoreo en Tiempo Real**: 
    *   **Estado de Guardia**: Indicadores visuales en vivo ("EN RONDA") en las tarjetas de guardias y mapa en vivo con seguimiento geoespacial.

### 🏢 Gestión Avanzada de Instalaciones y Secciones
*   **Organización por Secciones**: Creación opcional de "Secciones" dentro de cada instalación (ej. Pisos, Zonas, Edificios).
*   **Asignación Inteligente**: Guardias y puntos de marcaje vinculados a secciones específicas para un control estructurado.
*   **Filtro Contextual**: Los guardias solo visualizan los puntos y horarios pertinentes a la sección que se les asignó, mejorando la concentración, la usabilidad y la eficiencia.

### 🔐 Seguridad y Rendimiento
*   **Prevención de Auto-Login**: Aislamiento de sesiones con una instancia secundaria de Firebase Auth para asegurar que los administradores no pierdan su sesión al crear nuevos usuarios guardias/supervisores.
*   **CORS y Almacenamiento**: Configuración limpia de CORS en Firebase Storage para permitir carga rápida de imágenes tanto en entorno local (Vite) como nativo (Capacitor).
*   **Control de Eliminación**: Expulsión automática e inmediata (Logout) del sistema si un rol de seguridad borra el perfil de usuario en la base de datos de manera administrativa.
*   **Cierre de Sesión Automático**: Persistencia de sesión robusta (`browserSessionPersistence`) y manejo seguro de cierre de procesos.
*   **Protección Contra Doble Envío**: Estados de carga y bloqueos en botones de registro para evitar registros duplicados por error de red o interfaz.

## 🛠️ Instalación y Desarrollo

1.  **Instalar dependencias**: `npm install`
2.  **Modo desarrollo (Web)**: `npm run dev`
3.  **Sincronización Android**: `npm run build && npx cap sync`
4.  **Abrir Android Studio**: `npx cap open android`

## 📁 Estructura del Proyecto

*   `src/context/`: Lógica centralizada (`AuthContext`, `LocationContext`, manejo secundario de auth).
*   `src/screens/`:
    *   `HomeScreen.jsx`: Dashboard dinámico multinivel y módulo de asistencia QR.
    *   `AdminRoundsScreen.jsx`, `RoundDetailsScreen.jsx` & `AdminSchedulesScreen.jsx`: Selección, visualización detallada y ejecución de rondas e historial.
    *   `AdminAttendanceScreen.jsx`: Visualización general de asistencia del personal.
    *   `ReportsScreen.jsx` & `PDFScreen.jsx`: Historial visual y motor de generación de reportes PDF detallados.
    *   `SupervisorsScreen.jsx` & `ClientsScreen.jsx`: Gestión de roles de monitoreo.
    *   `GuardsScreen.jsx`: Gestión de personal (con validación RUT) y monitoreo de estado ("En ronda").
    *   `MapScreen.jsx`: Monitoreo geoespacial en vivo.
    *   `ScannerScreen.jsx`: Visor de cámara para lectura de QR/Barras.
*   `src/config/`: Conexión de Firebase, instancias de Auth y estilos globales.

---
Desarrollado con ❤️ para la gestión de seguridad inteligente.
