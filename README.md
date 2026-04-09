# Sistema de Rondas - Capacitor & Supabase Edition 🛡️

Sistema de gestión y monitoreo de rondas de seguridad en tiempo real. Este proyecto utiliza un stack web moderno para ofrecer una experiencia nativa fluida en Android e iOS utilizando tecnologías de alto rendimiento.

## 🛠️ Stack Tecnológico

### Frontend & Core
- **React 19**: Biblioteca principal para la interfaz de usuario.
- **Vite**: Herramienta de construcción (build tool) ultra rápida para desarrollo frontend.
- **Styled Components**: Sistema de estilizado basado en componentes (CSS-in-JS).
- **Lucide React**: Set de iconos vectoriales modernos y ligeros.

### Backend (BaaS) - Supabase
- **Supabase Auth**: Gestión de usuarios y sesiones seguras.
- **PostgreSQL**: Base de datos relacional para la persistencia de rondas, puntos y asistencia.
- **Supabase Storage**: Almacenamiento de evidencias fotográficas.
- **Supabase Realtime**: Sincronización en tiempo real de ubicaciones y estados de ronda mediante PostgreSQL Changes.

### Mobile & Nativo
- **Capacitor 6**: Framework para convertir la app web en aplicaciones nativas Android/iOS.
- **@capacitor/geolocation**: Seguimiento preciso de la ubicación del guardia.
- **@capacitor/camera**: Captura de evidencias fotográficas en alta resolución.
- **@capacitor-mlkit/barcode-scanning**: Motor de escaneo de códigos QR de alta velocidad.

### Librerías Adicionales
- **jsPDF & jsPDF-AutoTable**: Motor de generación de reportes administrativos en formato PDF.
- **React Router Dom**: Gestión de navegación y rutas de la aplicación.

## 🚀 Innovaciones y Rendimiento

### 📊 Estandarización de Identidad (RUT/DV)
- **Campos Separados**: Implementación de arquitectura RUT-DV en base de datos y UI para evitar errores de formato.
- **Contraseñas Numéricas**: Política de contraseñas por defecto basadas estrictamente en la parte numérica del RUT, facilitando el acceso inicial.
- **Saneamiento Automático**: Eliminación inteligente de puntos y guiones en tiempo real durante el registro y login.

### 🔐 Seguridad y Resiliencia Auth
- **Protección de Sesión**: Prevención de "secuestro de sesión" (Session Takeover) mediante clientes de autenticación aislados para administradores.
- **Auto-Reparación de Usuarios**: Lógica de auto-sincronización que vincula cuentas de Auth huérfanas con perfiles de base de datos de forma automática.
- **Cierre de Sesión Seguro**: Mecanismos para detectar y cerrar sesiones activas ante usos indebidos o accesos concurrentes.

### 📸 Motor de Evidencias de "Alta Resiliencia"
- **Sistema de Triple Reintento**: Reintentos automáticos de subida ante fallos de red.
- **Optimización de Imágenes**: Reducción de peso sin pérdida de claridad para transmisiones rápidas.
- **Caja Negra**: Diagnóstico técnico detallado de cada proceso de subida.

### 🔋 Optimización de Datos
- **GPS Throttling**: Sincronización inteligente de ubicación (60s / 50m) para optimizar el consumo de batería y datos móviles.

## ✨ Funcionalidades Core
- **Guardia**: Registro de asistencia, escaneo de puntos QR, y captura de evidencias con geoposición.
- **Monitoreo**: Mapa en vivo (Realtime) y seguimiento de historial de rondas.
- **Admin**: Gestión de personal (Supervisores, Guardias, Clientes), instalaciones, secciones y generación de reportes PDF ejecutivos.

## ⚙️ Instalación y Desarrollo

1.  **Instalar dependencias**: `npm install`
2.  **Preparar entorno**: Configurar `src/config/supabase.js`.
3.  **Configuración Crítica Supabase**:
    - Desactivar **"Confirm Email"** en Auth Settings.
    - Asegurar que la tabla `public.users` tenga las políticas RLS adecuadas.
4.  **Build**: `npm run build`
5.  **Sincronizar Nativo**: `npx cap sync android`
6.  **Ejecutar**: Abrir en **Android Studio** y lanzar al dispositivo.

---
Desarrollado con ❤️ para la gestión de seguridad inteligente.