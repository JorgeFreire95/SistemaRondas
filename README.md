# Sistema de Rondas - Capacitor Edition 🛡️

Sistema de gestión y monitoreo de rondas de seguridad en tiempo real. Este proyecto utiliza un stack web moderno (**Vite**, **React 19**) y **Capacitor 6** para ofrecer una experiencia nativa fluida en Android e iOS utilizando tecnologías web de alto rendimiento.

## 🚀 Innovaciones y Rendimiento

### 📸 Motor de Evidencias de "Alta Resiliencia"
Hemos reconstruido el núcleo de captura de fotos para garantizar que ninguna prueba se pierda, incluso en condiciones de red extremas:
- **Sistema de Triple Reintento**: La app realiza hasta 3 intentos automáticos de subida si detecta fallos de red.
- **Procesado "Pluma" (Instantáneo)**: Optimización agresiva de imágenes (20% calidad / 500px) que permite una captura y transición instantánea, ideal para dispositivos de gama baja.
- **Subida en Segundo Plano**: El guardia puede seguir con su ronda inmediatamente mientras el motor de fondo se encarga de la transmisión de datos.
- **Caja Negra (Diagnóstico)**: Registro técnico detallado de cada paso de la subida para identificar bloqueos de permisos o red en tiempo real.

### 📱 Experiencia Móvil Universal
- **Navegación Nativa**: Integración total con el **botón de retroceso físico** de Android y gestos laterales de iOS para una navegación intuitiva.
- **Adaptación "Safe Area"**: Diseño compatible con "notches" (muescas de cámara) y barras de gestos, asegurando que ningún botón quede tapado por el hardware del teléfono.
- **UI Inmersiva**: Configuración de `viewport-fit=cover` para una experiencia de pantalla completa real.

### 🔋 Optimización de Cuota y Datos
- **Sincronización Inteligente de GPS**: Throttling de ubicación a Firestore (60 segundos o 50 metros) para maximizar la duración de la cuota gratuita (Spark Plan) de Firebase.
- **Consumo Mínimo de Datos**: Reducción drástica del peso de las evidencias fotográficas y eliminación de logs innecesarios en producción.

## ✨ Funcionalidades Core

### 👮 Perfil Guardia
- **Asistencia QR**: Registro integral de entrada/salida de turno.
- **Rondas Guiadas**: Selección de horarios y puntos de marcaje obligatorios.
- **Preguntas de Seguridad**: Verificación de estado del punto (ej: "¿Puerta cerrada?") con evidencia fotográfica obligatoria.
- **Alertas de Diagnóstico**: Si una foto falla, el guardia ve un aviso visual claro con el motivo técnico (ej: señal débil).

### 💼 Perfil Monitoreo (Supervisor & Cliente)
- **Mapa en Vivo**: Seguimiento geoespacial de guardias activos ("En Ronda").
- **Historial Detallado**: Acceso instantáneo a los puntos marcados con fotos de evidencia.
- **Reportes PDF**: Generación de reportes profesionales con atribución automática de roles y filtros avanzados.

### ⚙️ Perfil Administrador (Control Total)
- **Gestión de Personal**: Validación estricta de RUT chileno y autogeneración de credenciales seguras.
- **Control de Instalaciones**: Organización por Secciones (Pisos, Zonas) y asignación de puntos de marcaje.
- **Prevención de Doble Sesión**: Aislamiento de perfiles para evitar conflictos de autenticación durante la creación de usuarios.

## 🛠️ Instalación y Desarrollo

1.  **Instalar dependencias**: `npm install`
2.  **Modo desarrollo (Web)**: `npm run dev`
3.  **Sincronización Nativa**: `npm run cap:sync`
4.  **Despliegue a Dispositivo**: Ejecutar el botón **"Run"** desde Android Studio.

---
Desarrollado con ❤️ para la gestión de seguridad inteligente.
