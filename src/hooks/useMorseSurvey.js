import { useState } from "react";
import { QUESTIONS, ENVIRONMENTAL_HAZARDS } from "../constants/surveyData";

export function useMorseSurvey() {
  const [answers, setAnswers] = useState({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  // Inicializamos los peligros dinámicamente con los IDs del arreglo
  const [hazards, setHazards] = useState(
    ENVIRONMENTAL_HAZARDS.reduce((acc, h) => ({ ...acc, [h.id]: false }), {}),
  );

  const morseScore = Object.keys(answers).reduce((total, key) => {
    return answers[key]
      ? total + (QUESTIONS.find((q) => q.id === key)?.points || 0)
      : total;
  }, 0);

  const selectedHazardsCount = Object.values(hazards).filter(Boolean).length;

  const answerCurrent = (value) => {
    setAnswers((prev) => ({
      ...prev,
      [QUESTIONS[currentQuestion].id]: value,
    }));
  };

  const next = () => {
    if (currentQuestion < QUESTIONS.length - 1) {
      setCurrentQuestion((q) => q + 1);
    }
  };

  const prev = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((q) => q - 1);
    }
  };

  const toggleHazard = (id) => {
    setHazards((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const reset = () => {
    setAnswers({});
    setHazards(
      ENVIRONMENTAL_HAZARDS.reduce((acc, h) => ({ ...acc, [h.id]: false }), {}),
    );
    setCurrentQuestion(0);
  };

  return {
    answers,
    currentQuestion,
    hazards,
    morseScore,
    selectedHazardsCount,
    answerCurrent,
    next,
    prev,
    toggleHazard,
    reset,
  };
}
