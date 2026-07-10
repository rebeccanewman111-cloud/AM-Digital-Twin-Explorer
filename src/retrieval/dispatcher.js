import { runTool } from "./registry.js";

export function dispatchQuestion(question) {
  const q = question.toLowerCase();

  if (q.includes("maximum force") || q.includes("max force") || q.includes("highest force")) {
    return runTool("getMaximumForce");
  }

  if (q.includes("average force") || q.includes("mean force")) {
    return runTool("getAverageForce");
  }

  if (q.includes("maximum elongation") || q.includes("max elongation") || q.includes("extension")) {
    return runTool("getMaximumElongation");
  }

  if (q.includes("duration") || q.includes("how long")) {
    return runTool("getExperimentDuration");
  }

  if (q.includes("current") || q.includes("playback")) {
    return runTool("getCurrentMeasurement");
  }

  if (q.includes("metadata") || q.includes("info") || q.includes("dimensions")) {
    return runTool("getMetadata");
  }

  if (q.includes("columns") || q.includes("available data")) {
    return runTool("getAvailableColumns");
  }

  return {
    error: true,
    message: "I do not have a retrieval tool for that question yet."
  };
}