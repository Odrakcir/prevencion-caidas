# Asistente Hogar Seguro

Plataforma web progresiva (PWA) diseñada para la prevención de caídas en adultos mayores. El sistema integra una evaluación clínica basada en la **Escala de Morse**, un panel de administración para investigadores y la conexión en tiempo real con sensores IoT (ESP32) para el monitoreo de la marcha.

## Características Principales

- **Evaluación Clínica:** Flujo interactivo accesible (WCAG 2.1 AA) basado en la Escala de Morse para determinar el nivel de riesgo de caídas.
- **Panel de Administración (Investigador):** 
  - Registro y gestión de pacientes.
  - Asignación de evaluaciones de riesgo.
  - Control de sesiones de prueba en vivo.
  - Visualización de telemetría en tiempo real.
- **Integración IoT:** Comunicación vía HTTP con microcontroladores ESP32 (sensores en cintura y pie) para iniciar y detener la captura de datos cinemáticos.
- **Base de Datos en la Nube:** Sincronización en tiempo real con Supabase (PostgreSQL y Auth).

## Tecnologías Utilizadas

- **Frontend:** React 18, Vite, CSS (estilos inline modulares).
- **Backend / Base de Datos:** Supabase (PostgreSQL, Row Level Security, Auth).
- **Hardware (IoT):** ESP32, sensores MPU6050 (acelerómetro/giroscopio) y FSR406 (presión plantar).

##  Estructura del Proyecto

```text
src/
├── components/          # Componentes de UI (Botones, Gráficos, Header)
├── constants/           # Datos estáticos (Preguntas de la encuesta)
├── hooks/               # Lógica de estado (Autenticación, Telemetría, Encuesta)
├── modules/             # Pantallas principales (Login, Admin, Vistas de usuario)
├── services/            # Conexión con Supabase y llamadas HTTP al ESP32
├── styles/              # Tema global y estilos compartidos
├── utils/               # Funciones auxiliares (Cálculo de riesgo)
└── App.jsx              # Orquestador de rutas y roles
