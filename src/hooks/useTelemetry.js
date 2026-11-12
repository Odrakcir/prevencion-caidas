import { useState, useEffect } from "react";

export function useTelemetry() {
  const [simMode, setSimMode] = useState("standing");
  const [simData, setSimData] = useState({
    tilt: 3.8,
    accelY: 0.98,
    fsrPressure: 49,
    gaitPhase: "Estático (Soporte Estable)",
    latency: 124,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      if (simMode === "standing") {
        setSimData({
          tilt: Number((3.2 + Math.random() * 1.2).toFixed(1)),
          accelY: Number((0.97 + Math.random() * 0.03).toFixed(2)),
          fsrPressure: Math.floor(46 + Math.random() * 5),
          gaitPhase: "Estático (Soporte Estable)",
          latency: Math.floor(118 + Math.random() * 20),
        });
      } else {
        const isStance = Math.random() > 0.45;
        setSimData({
          tilt: Number((7.2 + Math.random() * 4).toFixed(1)),
          accelY: Number((0.83 + Math.random() * 0.28).toFixed(2)),
          fsrPressure: isStance
            ? Math.floor(70 + Math.random() * 15)
            : Math.floor(2 + Math.random() * 6),
          gaitPhase: isStance
            ? "Fase de Apoyo (Stance)"
            : "Fase de Oscilación (Swing)",
          latency: Math.floor(122 + Math.random() * 28),
        });
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [simMode]);

  return { simMode, setSimMode, simData };
}
