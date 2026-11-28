# Asistente Hogar Seguro (PWA + IoT)

**Plataforma web progresiva (PWA) integrada con telemetría IoT** desarrollada como proyecto de tesis universitaria para la **prevención de caídas y fomento de la autonomía domiciliaria en adultos mayores**.

El sistema combina la evaluación preventiva de factores físicos y del entorno del hogar con el seguimiento de la marcha mediante sensores inerciales y plantares (**ESP32 + MPU6050 + FSR406**), ofreciendo dos experiencias diferenciadas: una interfaz simplificada en lenguaje positivo para el adulto mayor y un panel de análisis técnico para el investigador.

> **Aviso Ético y Académico:** *Hogar Seguro* es un prototipo universitario con fines exclusivamente educativos, ergonómicos y preventivos. **No emite diagnósticos médicos, pronósticos de salud ni indicaciones farmacológicas**, y no reemplaza la evaluación de un profesional de la salud.

---

## Tabla de Contenidos

- [Características Principales](#características-principales)
- [Accesibilidad Gerontológica (WCAG 2.1 AA) y Modelo TAM](#accesibilidad-gerontológica-wcag-21-aa-y-modelo-tam)
- [Arquitectura del Sistema](#arquitectura-del-sistema)
- [Integración Hardware IoT (ESP32)](#integración-hardware-iot-esp32)
- [Modelo de Base de Datos (Supabase)](#modelo-de-base-de-datos-supabase)
- [Tecnologías Utilizadas](#tecnologías-utilizadas)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Instalación y Ejecución Local](#instalación-y-ejecución-local)
- [Scripts Disponibles](#scripts-disponibles)

---

## Características Principales

### 1. Experiencia para el Adulto Mayor y Red de Apoyo
- **Evaluación Preventiva Guiada (`SurveyModule`):**
  - Registro de contacto familiar / red de apoyo.
  - Cuestionario preventivo adaptado de la **Escala de Morse** (paso a paso, 1 pregunta por pantalla).
  - **Revisión Interactiva del Hogar por 5 Habitaciones (`RoomFloorPlan`):** Ilustraciones arquitectónicas SVG interactivas (*Sala, Cocina, Dormitorio, Baño y Pasillos*) con pines numerados (`1`, `2`, `3`) sincronizados bidireccionalmente con 15 factores ambientales (`A1`–`E3`) y descripciones cotidianas.
- **Resultados y Plan de Acción (`RecommendationsModule`):**
  - **Estrellas de Seguridad (1 a 5 ★):** Retroalimentación positiva asociada al puntaje obtenido en la **Escala de Morse** y a los factores ambientales detectados (`5 ★` sin factores de riesgo, `4 ★` 1–24 pts / 1–2 peligros, `3 ★` 25–34 pts / 3–4 peligros, `2 ★` 35–44 pts / 5–6 peligros y `1 ★` ≥ 45 pts o ≥ 7 peligros), orientada al fortalecimiento de la autonomía.
  - **Acordeón por Habitación:** Agrupa solo las habitaciones donde se detectaron factores de riesgo, con barra de progreso y casillas interactivas.
  - **Guardado Explícito de Avances:** Botón dedicado *"Guardar Mis Recomendaciones"* con confirmación visual y persistencia en Supabase + respaldo local offline.
  - **Exportación y Difusión:** Descarga de **Ficha Preventiva en PDF** (agrupada por habitación + lista de *Primeros Pasos Sugeridos* con casillas para imprimir en familia) y envío directo por **WhatsApp**.

### 2. Panel de Control e Investigación (`AdminPanelModule`)
- **Control Remoto de Sesiones IoT:** Configuración persistente de la IP local del ESP32 y control de inicio/fin de sesiones (`POST /start` y `POST /stop`) sincronizado con `sesiones_prueba`.
- **Análisis de Estabilidad y Telemetría (`StabilityChart` & `StabilityChartSvg`):**
  - **Última Sesión (o sesión seleccionada):** Curva continua en tiempo real vía **Supabase Realtime** sobre la sesión completa del día, con **desplazamiento horizontal, eje Y fijo**, botones rápidos (*Inicio / Más reciente*), cálculo trigonométrico de inclinación (`Math.acos`) y nodos destacados de alerta.
  - **Histórico Completo:** Agrupación diaria en **gráfico de barras con línea de tendencia**, indicador de carga durante consultas largas, filtro de alertas y tarjetas compactas de **Tendencia Semanal y Diaria**.
- **Recomendaciones Cruzadas (`CrossAlerts`):** Motor de cruce entre telemetría de sensores y `peligros_ambientales` que genera sugerencias preventivas personalizadas ante 3 escenarios:
  1. **Iluminación Nocturna:** Variaciones de estabilidad entre `20:00` y `06:00` + `iluminacion_deficiente`.
  2. **Apoyo en el Baño:** Episodios de inestabilidad + `ausencia_barras`.
  3. **Rutas y Superficies:** Episodios de inestabilidad + `alfombras_sueltas` u `obstaculos_ruta`.
- **Reporte Longitudinal de Deterioro en PDF:** Exporta en formato A4 un **Análisis Histórico de Marcha** con estabilidad promedio global, días con alertas, tablas comparativas de **evolución por semanas y por días**, detección de posibles deterioros y recomendaciones cruzadas generadas.
- **Acordeón de Seguimiento de Recomendaciones (`AdminRecommendationsAccordion`):** Agrupa por categoría las recomendaciones almacenadas en Supabase permitiendo marcar/desmarcar su cumplimiento (`estado_aplicada`).

---

## Accesibilidad Gerontológica (WCAG 2.1 AA) y Modelo TAM

El diseño de la interfaz sigue pautas de accesibilidad web (**WCAG 2.1 AA**, alcanzando contraste **AAA** en lectura principal) y los principios del **Modelo de Aceptación Tecnológica (TAM)** de Davis:

| Dimensión | Implementación en el Sistema |
| :--- | :--- |
| **Contraste y Legibilidad (WCAG 1.4.3)** | Paleta clara forzada (`color-scheme: light`), texto principal `#0F172A` sobre `#FFFFFF` (17.8:1), cuerpo `#334155` (10.7:1) y botones `#FFFFFF` sobre `#0F766E` (5.4:1). |
| **Independencia del Color (WCAG 1.4.1)** | Todo estado combina color con número, ícono (`✓`, `!N`) y texto explícito. |
| **Objetivos Táctiles Amplios (WCAG 2.5.5)** | Botones y campos con altura mínima de `52–58 px` y tarjetas interactivas de `≥ 60–76 px` adaptadas a pantallas móviles. |
| **Navegación y Semántica (WCAG 2.1.1 / 2.4.7)** | Foco visible de `3 px`, atributos ARIA (`role="checkbox"`, `aria-expanded`, `aria-live`) y diseño responsivo sin scroll horizontal innecesario. |
| **Facilidad de Uso Percibida (TAM - PEOU)** | Flujo lineal paso a paso, lenguaje cotidiano libre de tecnicismos, planos visuales interactivos y guardado explícito con confirmación. |
| **Utilidad Percibida (TAM - PU)** | Estrellas de seguridad en positivo, plan de acción accionable por habitación, ficha PDF imprimible y alertas cruzadas preventivas. |

---

## Arquitectura del Sistema

```text
┌───────────────────────────┐        HTTP POST (/start, /stop)        ┌──────────────────────────┐
│     PWA Hogar Seguro      │ ──────────────────────────────────────► │   Microcontrolador IoT   │
│  React 19 + Vite (SVG)    │                                         │ ESP32 + MPU6050 + FSR406 │
└─────────────┬─────────────┘                                         └────────────┬─────────────┘
              │                                                                    │
              │ Supabase JS (Auth, REST, Realtime WebSocket)                       │ POST ventanas (~5s)
              ▼                                                                    ▼
┌───────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   Supabase (PostgreSQL)                                       │
│   Auth · usuarios · sesiones_prueba · eventos_telemetria · evaluaciones_mfs                   │
│   peligros_ambientales · recomendaciones · contactos_emergencia · dispositivos_iot            │
└───────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Integración Hardware IoT (ESP32)

### Comandos enviados desde el Panel de Investigador
- **Iniciar captura:** `POST http://<IP_ESP32>/start` con cuerpo `{ "id_sesion": "<uuid>" }`
- **Detener captura:** `POST http://<IP_ESP32>/stop` con cuerpo `{ "id_sesion": null }`

### Formato real en `eventos_telemetria.datos_cinematicos` (JSONB — Firmware `v2.1`)
El ESP32 agrupa las lecturas en ventanas de ~5 segundos (`ventana_ms`), consolidando datos del sensor inercial **MPU6050** (aceleración y giroscopio), presión plantar **FSR406**, métricas de ciclo de marcha y estado del enlace **BLE**:

```json
{
  "ax": -0.58,
  "ay": -0.01,
  "az": 9.41,
  "gx": -0.054,
  "gy": 0.007,
  "gz": 0.017,
  "mpu_ok": true,
  "n_apoyo": 0,
  "n_ciclo": 0,
  "cadencia": 0,
  "estado_pie": "levantado",
  "n_balanceo": 0,
  "ventana_ms": 5009,
  "version_fw": "v2.1",
  "ble_vigente": true,
  "fsr_muestras": 51,
  "mpu_muestras": 178,
  "contactos_fsr": 0,
  "fsr_max_crudo": 0,
  "fsr_min_crudo": 0,
  "fsr_saturadas": 0,
  "apoyo_ms_media": 0,
  "ciclo_ms_media": 0,
  "aceleracion_max": 9.48,
  "aceleracion_min": 9.37,
  "aceleracion_media": 9.43,
  "aceleracion_total": 9.43,
  "balanceo_ms_media": 0,
  "ble_perdidas_total": 0,
  "levantamientos_fsr": 0,
  "presion_max_intervalo": 0
}
```

A partir de `(ax, ay, az)`, `estado_pie`, `cadencia` y `presion_max_intervalo`, el frontend transforma cada paquete crudo en métricas interpretables para los gráficos y reportes.

### Procesamiento de Telemetría y Fórmulas de Transformación

El traspaso desde las lecturas crudas del sensor (`eventos_telemetria`) hasta los gráficos interactivos ocurre en 5 etapas dentro de `useRealtimeStability.js` y `StabilityChartSvg.jsx`:

1. **Magnitud de Aceleración Resultante ($g$):**
   $$g = \sqrt{a_x^2 + a_y^2 + a_z^2}$$
   Se calcula a partir de los tres ejes del acelerómetro MPU6050 (en $\text{m/s}^2$, redondeada a 2 decimales).

2. **Ángulo de Inclinación Real ($\theta$, en grados):**
   $$\theta = \mathrm{round}\!\left(\arccos\!\left(\mathrm{clamp}\!\left(\frac{a_z}{g},\,-1,\,1\right)\right) \cdot \frac{180}{\pi}\right)$$
   - La función $\mathrm{clamp}(\cdot, -1, 1)$ evita errores numéricos (`NaN`) por imprecisión de punto flotante.
   - En postura erguida ($a_z \approx g$), $\theta \approx 0^\circ$; al inclinarse el tronco, el ángulo crece proporcionalmente.

3. **Cálculo del Índice de Estabilidad (`0%` – `100%`) y Detección de Eventos:**

   | Condición Cinética y Plantar | Estabilidad Asignada | Evento Registrado |
   | :--- | :---: | :--- |
   | `cadencia == 0` y $\theta < 10^\circ$ (reposo erguido) | **`100%`** | Ninguno (`null`) |
   | `estado_pie == "apoyado"` (pie con apoyo firme) | **`95%`** | Ninguno (`null`) |
   | `estado_pie != "apoyado"` y $\theta \le 15^\circ$ (balanceo normal) | **`90%`** | Ninguno (`null`) |
   | `estado_pie != "apoyado"` y $15^\circ < \theta \le 25^\circ$ | **`60%`** | `Balanceo Inestable` |
   | `estado_pie != "apoyado"` y $\theta > 25^\circ$ | **`20%`** | `Riesgo de Caída` |

4. **Mapeo a Zonas Visuales y Coordenadas SVG:**
   - **Bandas de referencia:** Verde / **Estable** (`80% – 100%`), Ámbar / **Precaución** (`50% – 79%`) y Rojo / **Alerta** (`0% – 49%`).
   - **Proyección vertical exacta en el SVG:**
     $$y(s) = y_{\text{base}} - \left(\frac{\mathrm{clamp}(s, 0, 100)}{100}\right) \cdot H_{\text{gráfico}}$$
   - En **Última Sesión**, cada ventana se grafica cronológicamente en una curva de área continua desplazable horizontalmente (destacando en rojo todo nodo con `event != null`).

5. **Agregación Histórica y Detección de Deterioro Longitudinal:**
   - **Agrupación diaria (`processWeeklyData`):** Agrupa los eventos por fecha calendario local (`YYYY-MM-DD`, evitando desfases UTC) y calcula el promedio diario:
     $$\bar{s}_d = \mathrm{round}\!\left(\frac{1}{N_d}\sum_{i=1}^{N_d} s_i\right)$$
     junto con la estabilidad mínima del día, inclinación promedio, cadencia promedio y conteo real de alertas (`alertsCount`).
   - **Análisis de deterioro por semanas y días (`analyzeGaitProgression`):** Agrupa todas las sesiones por semana calendario (Lunes–Domingo) y por día, evaluando la variación $\Delta = \bar{s}_t - \bar{s}_{t-1}$:
     - $\Delta \le -5\%$ → **Posible deterioro / descenso relevante**.
     - $-4\% \le \Delta \le +4\%$ → **Comportamiento estable**.
     - $\Delta \ge +5\%$ → **Tendencia favorable / mejora**.

---

## Modelo de Base de Datos (Supabase)

La aplicación consume 8 tablas relacionales en el esquema `public` de PostgreSQL:

| Tabla | Propósito |
| :--- | :--- |
| `usuarios` | Perfil del participante (`id_usuario`, `rut`, `nombres`, `apellidos`, `fecha_nacimiento`, `nivel_riesgo_actual`, `is_admin`). |
| `contactos_emergencia` | Red de apoyo familiar asociada a cada participante. |
| `evaluaciones_mfs` | Registro histórico de evaluaciones basadas en la Escala de Morse y puntaje total. |
| `peligros_ambientales` | Factores del hogar consolidados (`iluminacion_deficiente`, `alfombras_sueltas`, `ausencia_barras`, `obstaculos_ruta`). |
| `recomendaciones` | Plan de acción generado por categoría/habitación con seguimiento `estado_aplicada`. |
| `dispositivos_iot` | Registro y estado de conexión de sensores vinculados. |
| `sesiones_prueba` | Sesiones de monitoreo (`activa` / `finalizada`) con fechas de inicio y término. |
| `eventos_telemetria` | Lecturas cinemáticas en formato `jsonb` vinculadas a `id_sesion` e `id_dispositivo`. |

---

## Tecnologías Utilizadas

- **Frontend:** React 19, Vite 8, SVG puro (gráficos interactivos y planos de habitaciones sin librerías externas de charting), CSS modular y estilos responsivos.
- **Backend / BaaS:** Supabase (`@supabase/supabase-js` v2 — Auth, PostgreSQL, Paginación y Realtime).
- **Hardware IoT:** ESP32, sensor inercial MPU6050 (aceleración 3 ejes) y sensor de fuerza plantar FSR406.

---

## Estructura del Proyecto

```text
pwa-prevencion-caidas/
├── public/
│   └── logo-utem.png                         # Logotipo institucional para reportes PDF
├── src/
│   ├── components/
│   │   ├── common/
│   │   │   ├── Button.jsx                    # Botones accesibles reutilizables
│   │   │   ├── Header.jsx                    # Cabecera unificada con cierre de sesión
│   │   │   ├── RiskBadge.jsx                 # Insignia de nivel de riesgo
│   │   │   └── SafetyStars.jsx               # Estrellas de seguridad (enfoque positivo TAM)
│   │   ├── dashboard/
│   │   │   ├── AdminRecommendationsAccordion.jsx  # Acordeón de recomendaciones en Admin
│   │   │   ├── CrossAlerts.jsx               # Recomendaciones Cruzadas (telemetría vs. entorno)
│   │   │   ├── PrintModal.jsx                # Ficha Preventiva imprimible / PDF
│   │   │   ├── StabilityChart.jsx            # Panel de KPIs, tendencias, filtros y PDF histórico
│   │   │   ├── StabilityChartSvg.jsx         # Gráficos SVG (scroll horizontal + barras diarias)
│   │   │   ├── StabilityLegend.jsx           # Leyenda de zonas de estabilidad
│   │   │   └── StabilityTooltip.jsx          # Detalle interactivo por lectura o por día
│   │   └── survey/
│   │       └── RoomFloorPlan.jsx             # 5 planos arquitectónicos SVG interactivos
│   ├── constants/
│   │   └── surveyData.js                     # Preguntas Morse y 15 peligros ambientales con guías
│   ├── hooks/
│   │   ├── useDesktop.js                     # Detección responsiva escritorio / móvil
│   │   ├── useMorseSurvey.js                 # Estado y puntaje de la evaluación preventiva
│   │   └── useRealtimeStability.js           # Telemetría Realtime, agrupación diaria y deterioro longitudinal
│   ├── modules/
│   │   ├── AdminPanelModule.jsx              # Panel de Control e Investigación
│   │   ├── DashboardModule.jsx               # Panel Principal del participante
│   │   ├── LoginModule.jsx                   # Inicio de sesión y registro sincronizado
│   │   ├── RecommendationsModule.jsx         # Resultados, Acordeón por Habitación y guardado
│   │   └── SurveyModule.jsx                  # Flujo guiado de bienvenida, red de apoyo y encuesta
│   ├── services/
│   │   ├── sessionService.js                 # Operaciones Supabase (perfiles, sesiones, telemetría, PDF) y ESP32
│   │   └── supabaseClient.js                 # Inicialización del cliente Supabase
│   ├── styles/
│   │   └── theme.js                          # Sistema de diseño accesible WCAG 2.1 AA
│   ├── utils/
│   │   └── riskStatus.js                     # Clasificación de riesgo y estrellas de protección
│   ├── App.jsx                               # Orquestador de autenticación, roles y vistas
│   ├── index.css                             # Estilos base, foco accesible y animaciones CSS
│   └── main.jsx                              # Punto de entrada React
├── index.html
├── package.json
└── vite.config.js
```

---

## Instalación y Ejecución Local

### Requisitos previos
- **Node.js** v18 o superior y **npm**.
- Un proyecto activo en **Supabase** con las tablas descritas y autenticación por correo habilitada.

### 1. Clonar e instalar dependencias
```bash
git clone <url-del-repositorio>
cd pwa-prevencion-caidas
npm install
```

### 2. Configurar variables de entorno
Crea un archivo `.env` en la raíz del proyecto con las credenciales de tu proyecto en Supabase:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_clave_publica_anon
```

> **Nota sobre roles:** Las cuentas creadas desde la pantalla **Crear Cuenta** se registran automáticamente con `is_admin = false`. Para habilitar una cuenta como investigador/administrador, actualiza su columna `is_admin = true` directamente en la tabla `public.usuarios` de Supabase.

### 3. Iniciar servidor de desarrollo
```bash
npm run dev
```
La aplicación estará disponible localmente en `http://localhost:5173`.

---

## Scripts Disponibles

| Comando | Descripción |
| :--- | :--- |
| `npm run dev` | Inicia el servidor de desarrollo local con Vite (HMR). |
| `npm run build` | Genera el bundle optimizado de producción en `dist/`. |
| `npm run preview` | Previsualiza localmente la compilación de producción. |
| `npm run lint` | Ejecuta ESLint sobre el código fuente. |
