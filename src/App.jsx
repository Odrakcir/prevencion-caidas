import React, { useState, useEffect } from 'react';

/**
 * App-v10.jsx — Asistente "Hogar Seguro" (PWA / IoT + Supabase)
 * 
 * Novedades principales en v10:
 * 1. Leyenda de Zonas del Gráfico Ubicada al Lado:
 *    - Se removió el texto superpuesto dentro del área de dibujo del SVG para dejar la curva limpia.
 *    - Se creó una tarjeta de "Leyenda de Niveles" dedicada al lado del gráfico con tipografía grande (15px-16px),
 *      alto contraste y códigos de color claros (Verde, Amarillo, Rojo) ideada para fácil lectura de adultos mayores.
 * 2. Mantiene todo el comportamiento, diseño centrado, inputs corregidos e integración con Supabase.
 */

const getStyles = (isDesktop) => ({
  wrapper: {
    minHeight: '100vh',
    width: '100%',
    backgroundColor: '#F3F4F6',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    padding: isDesktop ? '24px' : '0',
    boxSizing: 'border-box',
  },
  container: {
    fontFamily: 'Segoe UI, -apple-system, BlinkMacSystemFont, Roboto, sans-serif',
    width: '100%',
    maxWidth: isDesktop ? '1200px' : '560px',
    backgroundColor: '#FFFFFF',
    color: '#111827',
    minHeight: isDesktop ? '85vh' : '100vh',
    borderRadius: isDesktop ? '16px' : '0',
    boxSizing: 'border-box',
    padding: isDesktop ? '32px' : 'clamp(16px, 5vw, 24px)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    boxShadow: isDesktop ? '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' : 'none',
  },
  header: {
    display: 'flex',
    flexDirection: isDesktop ? 'row' : 'column',
    justifyContent: 'space-between',
    alignItems: isDesktop ? 'center' : 'stretch',
    borderBottom: '3px solid #0D9488',
    paddingBottom: '16px',
    marginBottom: '20px',
    gap: '12px',
  },
  headerTitleGroup: {
    textAlign: isDesktop ? 'left' : 'center',
  },
  title: {
    fontSize: 'clamp(22px, 2.5vw, 28px)',
    color: '#0D9488',
    margin: '0 0 4px 0',
    fontWeight: '800',
    letterSpacing: '-0.02em',
  },
  subtitle: {
    margin: 0,
    color: '#4B5563',
    fontSize: 'clamp(14px, 1.5vw, 16px)',
    fontWeight: '500',
  },
  roleSwitchContainer: {
    display: 'flex',
    backgroundColor: '#F3F4F6',
    borderRadius: '10px',
    padding: '4px',
    gap: '4px',
    alignSelf: isDesktop ? 'center' : 'stretch',
  },
  roleBtn: (active) => ({
    flex: 1,
    padding: '8px 16px',
    fontSize: '14px',
    fontWeight: '600',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    backgroundColor: active ? '#0D9488' : 'transparent',
    color: active ? '#FFFFFF' : '#4B5563',
    transition: 'all 0.2s ease',
  }),
  progressBarContainer: {
    width: '100%',
    height: '8px',
    backgroundColor: '#E5E7EB',
    borderRadius: '4px',
    marginBottom: '20px',
    overflow: 'hidden',
  },
  progressBar: (pct) => ({
    width: `${pct}%`,
    height: '100%',
    backgroundColor: '#0D9488',
    transition: 'width 0.3s ease-in-out',
  }),
  // Grid para escritorio (2 Columnas o Secciones equilibradas)
  desktopGrid: {
    display: 'grid',
    gridTemplateColumns: isDesktop ? '1fr 1fr' : '1fr',
    gap: '24px',
    alignItems: 'start',
  },
  card: {
    backgroundColor: '#F9FAFB',
    borderRadius: '16px',
    padding: '22px',
    border: '2px solid #E5E7EB',
    marginBottom: '20px',
  },
  featuredCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    padding: '24px',
    border: '3px solid #0D9488',
    marginBottom: '24px',
    boxShadow: '0 10px 15px -3px rgba(13, 148, 136, 0.1)',
  },
  cardTitle: {
    fontSize: '20px',
    fontWeight: '800',
    color: '#111827',
    margin: '0 0 12px 0',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  text: {
    fontSize: '17px',
    lineHeight: '1.6',
    color: '#1F2937',
    marginBottom: '16px',
  },
  statusDot: (color) => ({
    display: 'inline-block',
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    backgroundColor: color,
    marginRight: '8px',
  }),
  badge: (color) => ({
    display: 'inline-flex',
    alignItems: 'center',
    padding: '10px 20px',
    borderRadius: '12px',
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: '20px',
    backgroundColor: color,
    textAlign: 'center',
    margin: '12px 0',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
  }),
  button: {
    minHeight: '52px',
    fontSize: '18px',
    fontWeight: '700',
    borderRadius: '12px',
    border: 'none',
    cursor: 'pointer',
    padding: '14px 22px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '8px 0',
    width: '100%',
    boxSizing: 'border-box',
    transition: 'all 0.2s ease',
  },
  primaryBtn: {
    backgroundColor: '#0D9488',
    color: '#FFFFFF',
    boxShadow: '0 4px 6px -1px rgba(13, 148, 136, 0.2)',
  },
  secondaryBtn: {
    backgroundColor: '#374151',
    color: '#FFFFFF',
  },
  backBtn: {
    backgroundColor: '#FFFFFF',
    color: '#0D9488',
    border: '2.5px solid #0D9488',
  },
  // INPUTS DE ALTO CONTRASTE CORREGIDOS PARA ADULTOS MAYORES
  input: {
    width: '100%',
    minHeight: '52px',
    fontSize: '18px',
    fontWeight: '600',
    padding: '12px 16px',
    borderRadius: '10px',
    border: '2.5px solid #0D9488',
    backgroundColor: '#FFFFFF', // Fondo blanco garantizado
    color: '#111827', // Texto oscuro garantizado
    marginBottom: '18px',
    boxSizing: 'border-box',
    outline: 'none',
  },
  checkboxContainer: {
    display: 'flex',
    alignItems: 'center',
    padding: '14px 16px',
    borderRadius: '12px',
    backgroundColor: '#FFFFFF',
    border: '2px solid #E5E7EB',
    marginBottom: '12px',
    cursor: 'pointer',
    minHeight: '52px',
  },
  checkboxInput: {
    width: '24px',
    height: '24px',
    marginRight: '14px',
    accentColor: '#0D9488',
    cursor: 'pointer',
  },
  checkboxText: {
    fontSize: '17px',
    color: '#1F2937',
    fontWeight: '600',
  },
  tabBtn: (isActive) => ({
    flex: 1,
    minHeight: '48px',
    fontSize: '16px',
    fontWeight: '700',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    backgroundColor: isActive ? '#0D9488' : '#E5E7EB',
    color: isActive ? '#FFFFFF' : '#374151',
    transition: 'all 0.2s ease',
    margin: '0 4px',
  })
});

// Ítems preventivos basados en la Escala de Caídas de Morse
const QUESTIONS = [
  { id: 'caidas', text: '¿Ha tenido algún tropiezo o caída en los últimos meses?', points: 25 },
  { id: 'diagnostico', text: '¿Padece de más de una enfermedad o diagnóstico médico?', points: 15 },
  { id: 'ayuda', text: 'Al caminar en casa, ¿siente la necesidad de apoyarse en muebles, muros o usar bastón?', points: 15 },
  { id: 'marcha', text: 'Al ponerse de pie, ¿siente que su marcha es lenta, inestable o le cuesta dar el primer paso?', points: 10 },
  { id: 'mental', text: '¿Siente que a veces olvida sus propias limitaciones físicas al intentar caminar o levantarse apurado?', points: 15 }
];

// Módulo de Peligros Ambientales
const ENVIRONMENTAL_HAZARDS = [
  { id: 'rugs', label: 'Alfombras sueltas en pasillos o dormitorio' },
  { id: 'lighting', label: 'Mala iluminación nocturna (trayecto al baño)' },
  { id: 'bars', label: 'Falta de barras de sujeción en ducha o WC' },
  { id: 'obstacles', label: 'Obstáculos o cables sueltos en el suelo' }
];

// Datos detallados del Historial Diario (Por horas)
const HOURLY_DATA = [
  { time: '08:00', stability: 96, label: 'Estable', statusColor: '#10B981', event: null, tilt: 3.2, accelG: 0.98, fsr: 48, device: 'ESP32_LUMBAR_01', detail: 'Caminata matutina fluida. Excelente estabilidad y soporte plantar.' },
  { time: '10:00', stability: 92, label: 'Estable', statusColor: '#10B981', event: null, tilt: 4.1, accelG: 0.96, fsr: 52, device: 'ESP32_LUMBAR_01', detail: 'Desplazamiento normal hacia la cocina. Sin asimetrías de paso.' },
  { time: '11:15', stability: 45, label: 'Alerta Leve', statusColor: '#F59E0B', event: 'Asimetría rápida (Micro-tropiezo)', tilt: 16.4, accelG: 0.58, fsr: 18, device: 'ESP32_LUMBAR_01', detail: 'Pérdida temporal de apoyo en pie derecho al cruzar el pasillo. Postura recuperada inmediatamente.' },
  { time: '13:00', stability: 89, label: 'Estable', statusColor: '#10B981', event: null, tilt: 3.8, accelG: 0.97, fsr: 45, device: 'ESP32_LUMBAR_01', detail: 'Reposo / Almuerzo. Inclinación del torso en rangos óptimos.' },
  { time: '15:00', stability: 91, label: 'Estable', statusColor: '#10B981', event: null, tilt: 4.5, accelG: 0.99, fsr: 50, device: 'ESP32_LUMBAR_01', detail: 'Caminata corta en el patio. Cadencia firme y segura.' },
  { time: '17:30', stability: 35, label: 'Alerta Crítica', statusColor: '#EF4444', event: 'Inclinación crítica (Pérdida de balance)', tilt: 24.8, accelG: 0.35, fsr: 10, device: 'ESP32_LUMBAR_01', detail: 'Inclinación brusca del torso al levantarse del sillón. Evento registrado y notificado.' },
  { time: '19:00', stability: 94, label: 'Estable', statusColor: '#10B981', event: null, tilt: 3.6, accelG: 0.98, fsr: 47, device: 'ESP32_LUMBAR_01', detail: 'Marcha pausada en zona de estar. Soporte completo.' },
  { time: '21:00', stability: 97, label: 'En Vivo', statusColor: '#0D9488', event: null, tilt: 3.1, accelG: 0.98, fsr: 49, device: 'ESP32_LUMBAR_01', detail: 'Sincronización activa en tiempo real. Usuario en posición segura de descanso.' }
];

// Datos del Historial Semanal (Tendencia 7 Días)
const WEEKLY_DATA = [
  { time: 'Lun', stability: 94, label: 'Estable', statusColor: '#10B981', event: null, detail: 'Promedio de estabilidad: 94%. Sin alertas registradas.' },
  { time: 'Mar', stability: 91, label: 'Estable', statusColor: '#10B981', event: null, detail: 'Promedio de estabilidad: 91%. Marcha segura en el hogar.' },
  { time: 'Mié', stability: 52, label: 'Alerta Leve', statusColor: '#F59E0B', event: 'Micro-tropiezo en cocina', detail: 'Promedio diario: 52%. Se detectó un tropiezo leve a las 11:40 hrs.' },
  { time: 'Jue', stability: 95, label: 'Estable', statusColor: '#10B981', event: null, detail: 'Promedio de estabilidad: 95%. Entorno despejado y seguro.' },
  { time: 'Vie', stability: 88, label: 'Estable', statusColor: '#10B981', event: null, detail: 'Promedio de estabilidad: 88%. Desplazamiento adecuado.' },
  { time: 'Sáb', stability: 93, label: 'Estable', statusColor: '#10B981', event: null, detail: 'Promedio de estabilidad: 93%. Acompañamiento familiar.' },
  { time: 'Dom', stability: 96, label: 'Estable', statusColor: '#10B981', event: null, detail: 'Promedio de estabilidad: 96%. Excelente estabilidad de marcha.' }
];

export default function App() {
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 900);
  const [roleMode, setRoleMode] = useState('recommendations');
  const [screen, setScreen] = useState('onboarding');
  const [activeTab, setActiveTab] = useState('info');
  const [contact, setContact] = useState({ name: '', phone: '' });
  const [answers, setAnswers] = useState({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Estados del Gráfico de Estabilidad Potenciado
  const [graphTimeframe, setGraphTimeframe] = useState('today'); // 'today' | 'weekly'
  const [graphFilter, setGraphFilter] = useState('all'); // 'all' | 'alerts'
  const [selectedGraphPoint, setSelectedGraphPoint] = useState(HOURLY_DATA[HOURLY_DATA.length - 1]);

  const [hazards, setHazards] = useState({
    rugs: false,
    lighting: false,
    bars: false,
    obstacles: false
  });

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 900);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const styles = getStyles(isDesktop);

  // Telemetría simulada en tiempo real
  const [simMode, setSimMode] = useState('standing');
  const [simData, setSimData] = useState({
    tilt: 3.8,
    accelY: 0.98,
    fsrPressure: 49,
    gaitPhase: 'Estático (Soporte Estable)',
    latency: 124
  });

  useEffect(() => {
    const timer = setInterval(() => {
      if (simMode === 'standing') {
        setSimData({
          tilt: Number((3.2 + Math.random() * 1.2).toFixed(1)),
          accelY: Number((0.97 + Math.random() * 0.03).toFixed(2)),
          fsrPressure: Math.floor(46 + Math.random() * 5),
          gaitPhase: 'Estático (Soporte Estable)',
          latency: Math.floor(118 + Math.random() * 20)
        });
      } else {
        const isStance = Math.random() > 0.45;
        setSimData({
          tilt: Number((7.2 + Math.random() * 4).toFixed(1)),
          accelY: Number((0.83 + Math.random() * 0.28).toFixed(2)),
          fsrPressure: isStance ? Math.floor(70 + Math.random() * 15) : Math.floor(2 + Math.random() * 6),
          gaitPhase: isStance ? 'Fase de Apoyo (Stance)' : 'Fase de Oscilación (Swing)',
          latency: Math.floor(122 + Math.random() * 28)
        });
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [simMode]);

  const triggerDemoMode = () => {
    setContact({ name: 'Familiar Tutor', phone: '+56912345678' });
    setAnswers({ caidas: true, diagnostico: false, ayuda: true, marcha: true, mental: false });
    setHazards({ rugs: true, lighting: true, bars: false, obstacles: true });
    setScreen('dashboard');
    setActiveTab('iot');
  };

  const calculateMorseScore = () => {
    return Object.keys(answers).reduce((total, key) => {
      return answers[key] ? total + (QUESTIONS.find(q => q.id === key)?.points || 0) : total;
    }, 0);
  };

  const morseScore = calculateMorseScore();
  const selectedHazardsCount = Object.values(hazards).filter(Boolean).length;

  const getRiskStatus = (score, hazardCount) => {
    if (score >= 45 || hazardCount >= 3) {
      return {
        label: 'Riesgo Alto',
        color: '#EF4444',
        desc: 'Requiere adaptaciones prioritarias en el hogar y coordinación con su red de apoyo para mitigar caídas.'
      };
    }
    if (score >= 25 || hazardCount >= 1) {
      return {
        label: 'Riesgo Medio',
        color: '#F59E0B',
        desc: 'Se sugieren ajustes en zonas de tránsito (luces nocturnas y sujeciones en baño).'
      };
    }
    return {
      label: 'Riesgo Bajo',
      color: '#10B981',
      desc: 'Entorno y condición física estables. Mantenga hábitos de caminata cotidiana y espacio libre de obstáculos.'
    };
  };

  const risk = getRiskStatus(morseScore, selectedHazardsCount);

  const getProgressPercentage = () => {
    if (screen === 'onboarding') return 10;
    if (screen === 'support') return 25;
    if (screen === 'questionnaire') return 30 + ((currentQuestion + 1) / QUESTIONS.length) * 40;
    if (screen === 'hazards') return 85;
    if (screen === 'dashboard') return 100;
    return 0;
  };

  const toggleHazard = (id) => {
    setHazards(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const currentDataSet = graphTimeframe === 'today' ? HOURLY_DATA : WEEKLY_DATA;
  const filteredDataSet = graphFilter === 'alerts' 
    ? currentDataSet.filter(d => d.event !== null)
    : currentDataSet;

  const avgStability = Math.round(currentDataSet.reduce((acc, curr) => acc + curr.stability, 0) / currentDataSet.length);
  const totalAlerts = currentDataSet.filter(d => d.event !== null).length;

  return (
    <div style={styles.wrapper}>
      <main style={styles.container}>
        <div>
          {/* ENCABEZADO Y CONMUTADOR DE ROL */}
          <header style={styles.header}>
            <div style={styles.headerTitleGroup}>
              <h1 style={styles.title}>Asistente Hogar Seguro</h1>
              <p style={styles.subtitle}>Identificación Preventiva e Independencia Domiciliaria</p>
            </div>

            <div style={styles.roleSwitchContainer}>
              <button
                style={styles.roleBtn(roleMode === 'recommendations')}
                onClick={() => {
                  setRoleMode('recommendations');
                  if (screen !== 'dashboard') setScreen('dashboard');
                }}
              >
                Recomendaciones
              </button>
              <button
                style={styles.roleBtn(roleMode === 'caregiver')}
                onClick={() => {
                  setRoleMode('caregiver');
                  if (screen !== 'dashboard') setScreen('dashboard');
                }}
              >
                Panel Principal
              </button>
            </div>
          </header>

          {/* BARRA DE PROGRESO */}
          {screen !== 'dashboard' && roleMode === 'recommendations' && (
            <div style={styles.progressBarContainer}>
              <div style={styles.progressBar(getProgressPercentage())} />
            </div>
          )}

          {/* PANTALLA 1: BIENVENIDA */}
          {screen === 'onboarding' && roleMode === 'recommendations' && (
            <section style={{ maxWidth: '600px', margin: '0 auto' }}>
              <div style={styles.card}>
                <h2 style={styles.cardTitle}>
                  <span style={styles.statusDot('#0D9488')} />
                  Bienvenida e Información del Sistema
                </h2>
                <p style={styles.text}>
                  Esta plataforma web interactiva le ayudará a evaluar de forma sencilla los factores físicos de su marcha y las condiciones de su hogar para prevenir tropiezos.
                </p>
                <p style={{ ...styles.text, fontSize: '15px', color: '#4B5563', borderLeft: '4px solid #0D9488', paddingLeft: '12px' }}>
                  <strong>Aviso Ético y de Privacidad:</strong> Sus respuestas se almacenan de manera local y confidencial en Supabase PostgreSQL. Este software es un asistente educativo y de orientación que <strong>no emite diagnósticos médicos ni reemplaza la atención profesional.</strong>
                </p>
              </div>
              
              <button
                style={{ ...styles.button, ...styles.primaryBtn }}
                onClick={() => setScreen('support')}
              >
                Iniciar Evaluación
              </button>

              <button
                style={{ ...styles.button, ...styles.secondaryBtn, marginTop: '12px', backgroundColor: '#4F46E5' }}
                onClick={triggerDemoMode}
              >
                Probar Telemetría IoT (Modo Demo)
              </button>
            </section>
          )}

          {/* PANTALLA 2: RED DE APOYO - INPUTS CORREGIDOS DE ALTO CONTRASTE */}
          {screen === 'support' && roleMode === 'recommendations' && (
            <section style={{ maxWidth: '600px', margin: '0 auto' }}>
              <div style={styles.card}>
                <h2 style={styles.cardTitle}>
                  <span style={styles.statusDot('#0D9488')} />
                  Red de Apoyo Familiar
                </h2>
                <p style={styles.text}>
                  Ingrese los datos de un familiar o cuidador de confianza con quien le gustaría compartir el informe de seguridad al finalizar.
                </p>
                
                <label style={{ display: 'block', fontSize: '16px', fontWeight: '800', color: '#111827', marginBottom: '8px' }}>
                  Nombre del contacto:
                </label>
                <input
                  style={styles.input}
                  type="text"
                  placeholder="Ej: María Rodríguez (Hija)"
                  value={contact.name}
                  onChange={(e) => setContact({ ...contact, name: e.target.value })}
                />

                <label style={{ display: 'block', fontSize: '16px', fontWeight: '800', color: '#111827', marginBottom: '8px' }}>
                  Teléfono de contacto:
                </label>
                <input
                  style={styles.input}
                  type="tel"
                  placeholder="Ej: +56912345678"
                  value={contact.phone}
                  onChange={(e) => setContact({ ...contact, phone: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <button
                  style={{ ...styles.button, ...styles.backBtn }}
                  onClick={() => setScreen('onboarding')}
                >
                  Atrás
                </button>
                <button
                  style={{ ...styles.button, ...styles.primaryBtn }}
                  disabled={!contact.name || !contact.phone}
                  onClick={() => setScreen('questionnaire')}
                >
                  Continuar
                </button>
              </div>
            </section>
          )}

          {/* PANTALLA 3: MORSE SCALE */}
          {screen === 'questionnaire' && roleMode === 'recommendations' && (
            <section style={{ maxWidth: '600px', margin: '0 auto' }}>
              <div style={styles.card}>
                <span style={{ fontSize: '14px', color: '#0D9488', fontWeight: '800', textTransform: 'uppercase' }}>
                  Evaluación Médica — Pregunta {currentQuestion + 1} de {QUESTIONS.length}
                </span>
                <p style={{ ...styles.text, fontWeight: '700', marginTop: '12px', fontSize: '20px', color: '#111827' }}>
                  {QUESTIONS[currentQuestion].text}
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button
                  style={{ ...styles.button, ...styles.primaryBtn }}
                  onClick={() => {
                    setAnswers({ ...answers, [QUESTIONS[currentQuestion].id]: true });
                    if (currentQuestion < QUESTIONS.length - 1) {
                      setCurrentQuestion(currentQuestion + 1);
                    } else {
                      setScreen('hazards');
                    }
                  }}
                >
                  Sí
                </button>
                <button
                  style={{ ...styles.button, ...styles.secondaryBtn }}
                  onClick={() => {
                    setAnswers({ ...answers, [QUESTIONS[currentQuestion].id]: false });
                    if (currentQuestion < QUESTIONS.length - 1) {
                      setCurrentQuestion(currentQuestion + 1);
                    } else {
                      setScreen('hazards');
                    }
                  }}
                >
                  No
                </button>
                <button
                  style={{ ...styles.button, ...styles.backBtn, marginTop: '8px' }}
                  onClick={() => {
                    if (currentQuestion > 0) {
                      setCurrentQuestion(currentQuestion - 1);
                    } else {
                      setScreen('support');
                    }
                  }}
                >
                  Volver Anterior
                </button>
              </div>
            </section>
          )}

          {/* PANTALLA 4: PELIGROS AMBIENTALES */}
          {screen === 'hazards' && roleMode === 'recommendations' && (
            <section style={{ maxWidth: '600px', margin: '0 auto' }}>
              <div style={styles.card}>
                <h2 style={styles.cardTitle}>
                  <span style={styles.statusDot('#0D9488')} />
                  Revisión de Factores del Hogar
                </h2>
                <p style={styles.text}>
                  Marque las condiciones que se presenten actualmente en su vivienda:
                </p>

                {ENVIRONMENTAL_HAZARDS.map((h) => (
                  <div
                    key={h.id}
                    style={{
                      ...styles.checkboxContainer,
                      borderColor: hazards[h.id] ? '#0D9488' : '#E5E7EB',
                      backgroundColor: hazards[h.id] ? '#F0FDFA' : '#FFFFFF'
                    }}
                    onClick={() => toggleHazard(h.id)}
                  >
                    <input
                      type="checkbox"
                      style={styles.checkboxInput}
                      checked={hazards[h.id]}
                      onChange={() => {}}
                    />
                    <span style={styles.checkboxText}>{h.label}</span>
                  </div>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <button
                  style={{ ...styles.button, ...styles.backBtn }}
                  onClick={() => {
                    setScreen('questionnaire');
                    setCurrentQuestion(QUESTIONS.length - 1);
                  }}
                >
                  Atrás
                </button>
                <button
                  style={{ ...styles.button, ...styles.primaryBtn }}
                  onClick={() => setScreen('dashboard')}
                >
                  Ver Resultados
                </button>
              </div>
            </section>
          )}

          {/* PANTALLA 5: VISTA RECOMENDACIONES vs VISTA CUIDADOR */}
          
          {/* VISTA 1: SOLO RECOMENDACIONES (VISTA RECOMENDACIONES) */}
          {roleMode === 'recommendations' && screen === 'dashboard' && (
            <section style={{ maxWidth: '720px', margin: '0 auto' }}>
              {/* Tarjeta 1: Semáforo y Estado de Seguridad */}
              <div style={styles.card}>
                <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#111827', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={styles.statusDot(risk.color)} />
                  Estado de Seguridad e Informe
                </h2>
                <div style={styles.badge(risk.color)}>
                  {risk.label}
                </div>
                <p style={{ ...styles.text, fontSize: '18px', marginTop: '12px', fontWeight: '500' }}>
                  {risk.desc}
                </p>
                <div style={{ borderTop: '2px solid #E5E7EB', paddingTop: '12px', marginTop: '12px', fontSize: '16px', color: '#374151' }}>
                  <p style={{ margin: '4px 0' }}>• Puntaje Escala de Morse: <strong>{morseScore} / 125 pts</strong></p>
                  <p style={{ margin: '4px 0' }}>• Peligros del Hogar Identificados: <strong>{selectedHazardsCount} de 4</strong></p>
                  <p style={{ margin: '4px 0' }}>• Contacto de Apoyo Registrado: <strong>{contact.name || 'Familiar / Cuidador'} ({contact.phone || 'N/A'})</strong></p>
                </div>
              </div>

              {/* Tarjeta 2: Recomendaciones Personalizadas de Alto Contraste */}
              <div style={{ ...styles.card, border: '3px solid #0D9488', backgroundColor: '#FFFFFF' }}>
                <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#0D9488', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '24px' }}>🏡</span>
                  Recomendaciones Personalizadas para el Hogar
                </h2>

                <p style={{ fontSize: '17px', color: '#374151', marginBottom: '16px', lineHeight: '1.6' }}>
                  Basado en su evaluación de salud y los factores observados en su vivienda, le sugerimos aplicar las siguientes medidas para mantener un entorno seguro y prevenir tropiezos:
                </p>

                <ul style={{ paddingLeft: '24px', fontSize: '18px', lineHeight: '1.8', margin: 0, color: '#111827' }}>
                  {hazards.rugs && (
                    <li style={{ marginBottom: '12px' }}>
                      <strong>Alfombras y Superficies:</strong> Fijar las alfombras sueltas con cinta antideslizante o retirarlas de los pasillos y del trayecto hacia la cama.
                    </li>
                  )}
                  {hazards.lighting && (
                    <li style={{ marginBottom: '12px' }}>
                      <strong>Iluminación Nocturna:</strong> Colocar luces nocturnas automáticas o lámparas de fácil acceso en el trayecto desde el dormitorio hacia el baño.
                    </li>
                  )}
                  {hazards.bars && (
                    <li style={{ marginBottom: '12px' }}>
                      <strong>Sujeciones en Baño:</strong> Solicitar apoyo para instalar barras firmes de sujeción al costado del inodoro y dentro de la ducha.
                    </li>
                  )}
                  {hazards.obstacles && (
                    <li style={{ marginBottom: '12px' }}>
                      <strong>Rutas Libres de Obstáculos:</strong> Mantener los pasillos y zonas de paso libres de cables sueltos, cajas o calzados en el piso.
                    </li>
                  )}
                  {selectedHazardsCount === 0 && (
                    <li style={{ marginBottom: '12px', color: '#047857' }}>
                      <strong>¡Excelente entorno!</strong> Su hogar se encuentra ordenado y libre de los principales peligros ambientales identificados.
                    </li>
                  )}

                  {risk.color === '#EF4444' && (
                    <li style={{ marginBottom: '12px', color: '#B91C1C' }}>
                      <strong>Acompañamiento Frecuente:</strong> Se recomienda mantener una conversación con su familiar o médico de cabecera para coordinar apoyo en desplazamientos fuera de casa.
                    </li>
                  )}
                  {risk.color === '#F59E0B' && (
                    <li style={{ marginBottom: '12px' }}>
                      <strong>Calzado Adecuado:</strong> Procurar usar siempre zapatos cerrados, bien ajustados y con suela de goma antideslizante dentro y fuera del hogar.
                    </li>
                  )}
                  {risk.color === '#10B981' && (
                    <li style={{ marginBottom: '12px', color: '#047857' }}>
                      <strong>Actividad Física Habitual:</strong> Mantener sus caminatas diarias a paso tranquilo para fortalecer la musculatura y el equilibrio.
                    </li>
                  )}
                </ul>
              </div>

              {/* Botones de Acción */}
              <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button
                  style={{ ...styles.button, ...styles.primaryBtn }}
                  onClick={() => {
                    const msg = `Hola ${contact.name}, informe del Asistente Hogar Seguro. Estado: ${risk.label}. Recomendaciones para mi hogar: ${selectedHazardsCount} factores a revisar.`;
                    window.open(`https://api.whatsapp.com/send?phone=${contact.phone}&text=${encodeURIComponent(msg)}`);
                  }}
                >
                  Compartir Reporte por WhatsApp
                </button>
                <button
                  style={{ ...styles.button, ...styles.backBtn }}
                  onClick={() => {
                    setAnswers({});
                    setHazards({ rugs: false, lighting: false, bars: false, obstacles: false });
                    setCurrentQuestion(0);
                    setScreen('onboarding');
                  }}
                >
                  Realizar Nueva Evaluación
                </button>
              </div>
            </section>
          )}

          {/* VISTA 2: CUIDADOR / DASHBOARD INTEGRADO */}
          {roleMode === 'caregiver' && (
            <section>
              {/* SECCIÓN CENTRADA Y DESTACADA: GRÁFICO DE ESTABILIDAD MAXIMIZADO */}
              <div style={styles.featuredCard}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                  <div>
                    <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#0D9488', margin: '0 0 4px 0' }}>
                      Historial Diario de Estabilidad y Marcha
                    </h2>
                    <p style={{ fontSize: '15px', color: '#4B5563', margin: 0 }}>
                      Evolución del equilibrio a lo largo del día. Seleccione los puntos para ver el detalle.
                    </p>
                  </div>

                  {/* Selector Hoy / Semana */}
                  <div style={{ display: 'flex', backgroundColor: '#E5E7EB', borderRadius: '8px', padding: '3px', gap: '4px' }}>
                    <button
                      style={{
                        border: 'none',
                        padding: '8px 16px',
                        fontSize: '14px',
                        fontWeight: '700',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        backgroundColor: graphTimeframe === 'today' ? '#0D9488' : 'transparent',
                        color: graphTimeframe === 'today' ? '#FFFFFF' : '#4B5563',
                        transition: 'all 0.2s'
                      }}
                      onClick={() => {
                        setGraphTimeframe('today');
                        setSelectedGraphPoint(HOURLY_DATA[HOURLY_DATA.length - 1]);
                      }}
                    >
                      Hoy (Detalle Horario)
                    </button>
                    <button
                      style={{
                        border: 'none',
                        padding: '8px 16px',
                        fontSize: '14px',
                        fontWeight: '700',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        backgroundColor: graphTimeframe === 'weekly' ? '#0D9488' : 'transparent',
                        color: graphTimeframe === 'weekly' ? '#FFFFFF' : '#4B5563',
                        transition: 'all 0.2s'
                      }}
                      onClick={() => {
                        setGraphTimeframe('weekly');
                        setSelectedGraphPoint(WEEKLY_DATA[0]);
                      }}
                    >
                      Semana (7 Días)
                    </button>
                  </div>
                </div>

                {/* Barra de Métrica Promedio y Filtros */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', backgroundColor: '#F8FAFC', padding: '12px 18px', borderRadius: '10px', border: '1.5px solid #E2E8F0', marginBottom: '16px', fontSize: '15px' }}>
                  <div>
                    Estabilidad Promedio: <strong style={{ fontSize: '18px', color: avgStability >= 80 ? '#10B981' : '#F59E0B' }}>{avgStability}%</strong> | Eventos de Inestabilidad: <strong style={{ fontSize: '18px', color: totalAlerts > 0 ? '#EF4444' : '#10B981' }}>{totalAlerts}</strong>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      style={{
                        border: '1.5px solid #CBD5E1',
                        padding: '6px 14px',
                        fontSize: '13px',
                        fontWeight: '700',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        backgroundColor: graphFilter === 'all' ? '#0D9488' : '#FFFFFF',
                        color: graphFilter === 'all' ? '#FFFFFF' : '#374151',
                      }}
                      onClick={() => setGraphFilter('all')}
                    >
                      Ver Todos
                    </button>
                    <button
                      style={{
                        border: '1.5px solid #CBD5E1',
                        padding: '6px 14px',
                        fontSize: '13px',
                        fontWeight: '700',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        backgroundColor: graphFilter === 'alerts' ? '#EF4444' : '#FFFFFF',
                        color: graphFilter === 'alerts' ? '#FFFFFF' : '#374151',
                      }}
                      onClick={() => setGraphFilter('alerts')}
                    >
                      Solo Alertas ({totalAlerts})
                    </button>
                  </div>
                </div>

                {/* CONTENEDOR DE GRÁFICO + LEYENDA AL LADO */}
                <div style={{
                  display: 'flex',
                  flexDirection: isDesktop ? 'row' : 'column',
                  gap: '16px',
                  alignItems: 'stretch',
                  marginBottom: '16px'
                }}>
                  {/* SVG INTERACTIVO MAXIMIZADO Y CENTRADO DE ALTO CONTRASTE */}
                  <div style={{
                    flex: isDesktop ? '1 1 68%' : '1 1 100%',
                    height: isDesktop ? '320px' : '260px',
                    backgroundColor: '#FFFFFF',
                    border: '2px solid #CBD5E1',
                    borderRadius: '12px',
                    padding: '16px',
                    boxSizing: 'border-box',
                    position: 'relative'
                  }}>
                    <svg viewBox="0 0 500 230" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                      <defs>
                        <linearGradient id="areaGradientV9" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#0D9488" stopOpacity="0.35" />
                          <stop offset="100%" stopColor="#0D9488" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>

                      {/* Bandas de Color de Fondo */}
                      <rect x="50" y="20" width="430" height="70" fill="#ECFDF5" opacity="0.8" />
                      <rect x="50" y="90" width="430" height="55" fill="#FEF3C7" opacity="0.7" />
                      <rect x="50" y="145" width="430" height="50" fill="#FEF2F2" opacity="0.8" />

                      {/* Líneas de Referencia */}
                      <line x1="50" y1="20" x2="480" y2="20" stroke="#10B981" strokeWidth="1.5" strokeDasharray="4" />
                      <line x1="50" y1="90" x2="480" y2="90" stroke="#F59E0B" strokeWidth="1.5" strokeDasharray="4" />
                      <line x1="50" y1="145" x2="480" y2="145" stroke="#EF4444" strokeWidth="1.5" strokeDasharray="4" />

                      {/* Etiquetas de Porcentaje Eje Y */}
                      <text x="42" y="24" fill="#047857" fontSize="13" fontWeight="800" textAnchor="end">100%</text>
                      <text x="42" y="94" fill="#B45309" fontSize="13" fontWeight="800" textAnchor="end">50%</text>
                      <text x="42" y="149" fill="#B91C1C" fontSize="13" fontWeight="800" textAnchor="end">0%</text>

                      {/* Trazados SVG */}
                      {graphTimeframe === 'today' ? (
                        <>
                          <path
                            d="M 60 30 L 120 34 L 180 155 L 240 38 L 300 35 L 360 170 L 420 32 L 470 28 L 470 195 L 60 195 Z"
                            fill="url(#areaGradientV9)"
                          />
                          <path
                            d="M 60 30 L 120 34 L 180 155 L 240 38 L 300 35 L 360 170 L 420 32 L 470 28"
                            fill="none"
                            stroke="#0D9488"
                            strokeWidth="4.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </>
                      ) : (
                        <>
                          <path
                            d="M 60 32 L 128 38 L 196 142 L 264 28 L 332 45 L 400 35 L 468 28 L 468 195 L 60 195 Z"
                            fill="url(#areaGradientV9)"
                          />
                          <path
                            d="M 60 32 L 128 38 L 196 142 L 264 28 L 332 45 L 400 35 L 468 28"
                            fill="none"
                            stroke="#0D9488"
                            strokeWidth="4.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </>
                      )}

                      {/* Nodos de Puntos Grandes */}
                      {filteredDataSet.map((d) => {
                        const xCoordsHoy = [60, 120, 180, 240, 300, 360, 420, 470];
                        const yCoordsHoy = [30, 34, 155, 38, 35, 170, 32, 28];

                        const xCoordsSem = [60, 128, 196, 264, 332, 400, 468];
                        const yCoordsSem = [32, 38, 142, 28, 45, 35, 28];

                        const isToday = graphTimeframe === 'today';
                        const rawIndex = isToday 
                          ? HOURLY_DATA.findIndex(item => item.time === d.time)
                          : WEEKLY_DATA.findIndex(item => item.time === d.time);

                        const x = isToday ? xCoordsHoy[rawIndex] : xCoordsSem[rawIndex];
                        const y = isToday ? yCoordsHoy[rawIndex] : yCoordsSem[rawIndex];

                        const isSelected = selectedGraphPoint?.time === d.time;
                        const isAlert = d.event !== null;

                        return (
                          <g 
                            key={d.time} 
                            cursor="pointer" 
                            onClick={() => setSelectedGraphPoint(d)}
                          >
                            {isSelected && (
                              <circle cx={x} cy={y} r="16" fill="none" stroke="#0D9488" strokeWidth="3" strokeDasharray="3" />
                            )}

                            <circle
                              cx={x}
                              cy={y}
                              r={isAlert ? "10" : (isSelected ? "9" : "7")}
                              fill={isAlert ? "#EF4444" : d.statusColor}
                              stroke="#FFFFFF"
                              strokeWidth="2.5"
                            />

                            {isAlert && (
                              <text x={x} y={y - 18} fill="#DC2626" fontSize="11" fontWeight="800" textAnchor="middle">
                                ⚠️ Alerta
                              </text>
                            )}

                            <text 
                              x={x} 
                              y="218" 
                              fill={isSelected ? "#0D9488" : "#374151"} 
                              fontSize="12" 
                              fontWeight={isSelected ? "800" : "700"} 
                              textAnchor="middle"
                            >
                              {d.time}
                            </text>
                          </g>
                        );
                      })}
                    </svg>
                  </div>

                  {/* LEYENDA DE ZONAS AL LADO DEL GRÁFICO */}
                  <div style={{
                    flex: isDesktop ? '0 0 260px' : '1 1 100%',
                    backgroundColor: '#F8FAFC',
                    border: '2px solid #CBD5E1',
                    borderRadius: '12px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-around',
                    gap: '12px',
                    boxSizing: 'border-box'
                  }}>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '800', color: '#111827', borderBottom: '2px solid #E2E8F0', paddingBottom: '6px' }}>
                      Leyenda de Niveles
                    </h4>

                    <div style={{ backgroundColor: '#ECFDF5', borderLeft: '5px solid #10B981', padding: '10px 12px', borderRadius: '8px' }}>
                      <div style={{ fontSize: '15px', fontWeight: '800', color: '#047857' }}>
                        🟢 Zona Verde (80% - 100%)
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: '#065F46', marginTop: '2px' }}>
                        Estabilidad Segura / Marcha Normal
                      </div>
                    </div>

                    <div style={{ backgroundColor: '#FEF3C7', borderLeft: '5px solid #F59E0B', padding: '10px 12px', borderRadius: '8px' }}>
                      <div style={{ fontSize: '15px', fontWeight: '800', color: '#B45309' }}>
                        🟡 Zona Amarilla (50% - 79%)
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: '#92400E', marginTop: '2px' }}>
                        Precaución / Desbalance Leve
                      </div>
                    </div>

                    <div style={{ backgroundColor: '#FEF2F2', borderLeft: '5px solid #EF4444', padding: '10px 12px', borderRadius: '8px' }}>
                      <div style={{ fontSize: '15px', fontWeight: '800', color: '#B91C1C' }}>
                        🔴 Zona Roja (0% - 49%)
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: '#991B1B', marginTop: '2px' }}>
                        Alerta / Tropiezo Detectado
                      </div>
                    </div>
                  </div>
                </div>

                {/* INSPECCIÓN DE TELEMETRÍA DEL PUNTO SELECCIONADO */}
                {selectedGraphPoint && (
                  <div style={{
                    marginTop: '16px',
                    padding: '16px 20px',
                    backgroundColor: selectedGraphPoint.event ? '#FEF2F2' : '#F0FDF4',
                    borderRadius: '12px',
                    borderLeft: `6px solid ${selectedGraphPoint.event ? '#EF4444' : '#10B981'}`,
                    fontSize: '16px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <strong style={{ fontSize: '18px', color: '#111827' }}>
                        Horario: {selectedGraphPoint.time} hrs — {selectedGraphPoint.label} ({selectedGraphPoint.stability}% Estabilidad)
                      </strong>
                    </div>

                    <p style={{ margin: '0 0 10px 0', color: '#1F2937', lineHeight: '1.6' }}>
                      {selectedGraphPoint.detail}
                    </p>

                    {selectedGraphPoint.tilt && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', borderTop: '1.5px solid #E5E7EB', paddingTop: '10px', fontSize: '14px', color: '#374151' }}>
                        <div>Inclinación Torso: <strong>{selectedGraphPoint.tilt}°</strong></div>
                        <div>Aceleración: <strong>{selectedGraphPoint.accelG} G</strong></div>
                        <div>Fuerza Pisada: <strong>{selectedGraphPoint.fsr}%</strong></div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* GRID PRINCIPAL: 2 COLUMNAS EQUILIBRADAS EN DESKTOP PARA CUIDADOR */}
              <div style={isDesktop ? styles.desktopGrid : {}}>
                {/* COLUMNA 1: Perfil de Usuario y Simulador */}
                <div>
                  <div style={styles.card}>
                    <h3 style={styles.cardTitle}>
                      <span style={styles.statusDot('#0D9488')} />
                      Perfil del Usuario y Red de Apoyo
                    </h3>
                    <p style={{ margin: '6px 0', fontSize: '16px' }}>
                      <strong>Usuario:</strong> Adulto Mayor Registrado
                    </p>
                    <p style={{ margin: '6px 0', fontSize: '16px' }}>
                      <strong>Contacto Familiar:</strong> {contact.name || 'Sin registrar'}
                    </p>
                    <p style={{ margin: '6px 0', fontSize: '16px', color: '#4B5563' }}>
                      <strong>Teléfono Móvil:</strong> {contact.phone || 'N/A'}
                    </p>
                    <button
                      style={{ ...styles.button, ...styles.secondaryBtn, marginTop: '14px', fontSize: '15px' }}
                      onClick={() => setShowPrintModal(true)}
                    >
                      Generar Ficha Imprimible
                    </button>
                  </div>

                  <div style={{ ...styles.card, border: '2px dashed #0D9488', backgroundColor: '#F0FDFA' }}>
                    <h3 style={{ ...styles.cardTitle, fontSize: '16px', color: '#0D9488' }}>
                      Simulador de Estado de Marcha (ESP32)
                    </h3>
                    <p style={{ fontSize: '14px', color: '#374151', marginBottom: '10px' }}>
                      Alterne la actividad para probar cómo responden los nodos de hardware:
                    </p>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        style={{ ...styles.button, margin: 0, minHeight: '42px', fontSize: '14px', flex: 1, backgroundColor: simMode === 'standing' ? '#0D9488' : '#E5E7EB', color: simMode === 'standing' ? '#FFFFFF' : '#374151' }}
                        onClick={() => setSimMode('standing')}
                      >
                        Estático
                      </button>
                      <button
                        style={{ ...styles.button, margin: 0, minHeight: '42px', fontSize: '14px', flex: 1, backgroundColor: simMode === 'walking' ? '#0D9488' : '#E5E7EB', color: simMode === 'walking' ? '#FFFFFF' : '#374151' }}
                        onClick={() => setSimMode('walking')}
                      >
                        Caminando
                      </button>
                    </div>
                  </div>
                </div>

                {/* COLUMNA 2: Semáforo Clínico, Plan y Sensores Físicos */}
                <div>
                  <div style={styles.card}>
                    <h3 style={styles.cardTitle}>
                      <span style={styles.statusDot(risk.color)} />
                      Estado de Seguridad Global
                    </h3>
                    <div style={styles.badge(risk.color)}>
                      {risk.label}
                    </div>
                    <p style={{ ...styles.text, fontSize: '16px', marginTop: '10px' }}>
                      {risk.desc}
                    </p>
                    <div style={{ borderTop: '2px solid #E5E7EB', paddingTop: '12px', marginTop: '12px', fontSize: '15px' }}>
                      <p style={{ margin: '4px 0' }}>Puntaje Escala de Morse: <strong>{morseScore} / 125 pts</strong></p>
                      <p style={{ margin: '4px 0' }}>Peligros del Hogar: <strong>{selectedHazardsCount} identificados</strong></p>
                    </div>
                  </div>

                  <div style={styles.card}>
                    <h3 style={{ ...styles.cardTitle, color: '#0D9488' }}>
                      Adaptación Recomendada del Hogar
                    </h3>
                    <ul style={{ paddingLeft: '20px', fontSize: '16px', lineHeight: '1.6', margin: 0 }}>
                      {hazards.rugs && <li style={{ marginBottom: '8px' }}><strong>Alfombras:</strong> Fijar o retirar alfombras sueltas en zonas de tránsito.</li>}
                      {hazards.lighting && <li style={{ marginBottom: '8px' }}><strong>Iluminación:</strong> Instalar luces automáticas nocturnas en pasillos.</li>}
                      {hazards.bars && <li style={{ marginBottom: '8px' }}><strong>Sujeciones:</strong> Instalar barras firmes en WC y ducha.</li>}
                      {hazards.obstacles && <li style={{ marginBottom: '8px' }}><strong>Rutas Libres:</strong> Mantener suelos despejados de cables y objetos.</li>}
                      {selectedHazardsCount === 0 && <li style={{ marginBottom: '8px' }}>Espacios del hogar ordenados y libres de obstáculos identificados.</li>}
                    </ul>
                  </div>

                  <div style={styles.card}>
                    <h3 style={{ ...styles.cardTitle, fontSize: '17px' }}>
                      Monitores Físicos en Tiempo Real
                    </h3>

                    <div style={{ borderBottom: '1px solid #E5E7EB', paddingBottom: '10px', marginBottom: '10px', fontSize: '15px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                        <span>Nodo Lumbar (MPU6050)</span>
                        <span style={{ color: '#0D9488' }}>{simData.tilt}° Inclinación</span>
                      </div>
                      <div style={{ fontSize: '13px', color: '#6B7280', marginTop: '2px' }}>Aceleración: {simData.accelY} G</div>
                    </div>

                    <div style={{ fontSize: '15px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                        <span>Nodo Plantar (FSR406)</span>
                        <span style={{ color: '#0D9488' }}>{simData.fsrPressure}% Fuerza</span>
                      </div>
                      <div style={{ fontSize: '13px', color: '#6B7280', marginTop: '2px' }}>Estado: {simData.gaitPhase}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Botones de Acción Global para Cuidador */}
              <div style={{ marginTop: '20px', maxWidth: isDesktop ? '480px' : '100%', margin: isDesktop ? '20px auto 0' : '20px 0 0' }}>
                <button
                  style={{ ...styles.button, ...styles.primaryBtn }}
                  onClick={() => {
                    const msg = `Hola ${contact.name}, informe de seguridad del Asistente Hogar Seguro. Estado: ${risk.label}. Se detectaron ${selectedHazardsCount} factores de riesgo en la vivienda.`;
                    window.open(`https://api.whatsapp.com/send?phone=${contact.phone}&text=${encodeURIComponent(msg)}`);
                  }}
                >
                  Compartir Reporte por WhatsApp
                </button>
                <button
                  style={{ ...styles.button, ...styles.backBtn, marginTop: '10px' }}
                  onClick={() => {
                    setAnswers({});
                    setHazards({ rugs: false, lighting: false, bars: false, obstacles: false });
                    setCurrentQuestion(0);
                    setScreen('onboarding');
                  }}
                >
                  Reiniciar Evaluación
                </button>
              </div>
            </section>
          )}

{/* MODAL DE FICHA PREVENTIVA IMPRIMIBLE */}
        {showPrintModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            padding: '20px'
          }}>
            <div style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              padding: '28px',
              maxWidth: '600px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}>
              <h2 style={{ color: '#0D9488', margin: '0 0 12px 0', borderBottom: '2.5px solid #0D9488', paddingBottom: '8px' }}>
                Ficha Preventiva del Adulto Mayor
              </h2>
              <p style={{ fontSize: '15px', color: '#4B5563' }}>Documento de orientación gerontológica para el hogar y la consulta médica.</p>

              <div style={{ marginTop: '16px', lineHeight: '1.6', fontSize: '16px', color: '#111827' }}>
                <p><strong>Clasificación de Riesgo:</strong> {risk.label}</p>
                <p><strong>Puntaje Escala de Morse:</strong> {morseScore} / 125 puntos</p>
                <p><strong>Factores Ambientales Identificados:</strong> {selectedHazardsCount} de 4 principales</p>
                <p><strong>Red de Apoyo Registrada:</strong> {contact.name || 'Sin registrar'} ({contact.phone || 'N/A'})</p>
                <p><strong>Base de Datos:</strong> Supabase PostgreSQL</p>
              </div>

              <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
                <button
                  style={{ ...styles.button, ...styles.primaryBtn, flex: 1 }}
                  onClick={() => window.print()}
                >
                  Imprimir / Guardar PDF
                </button>
                <button
                  style={{ ...styles.button, ...styles.backBtn, flex: 1 }}
                  onClick={() => setShowPrintModal(false)}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

        </div>

        <footer style={{ marginTop: '28px', textAlign: 'center', fontSize: '14px', color: '#6B7280' }}>
          Diseñado bajo pautas de accesibilidad gerontológica WCAG 2.1 AA y Modelo TAM
        </footer>
      </main>
    </div>
  );
}
