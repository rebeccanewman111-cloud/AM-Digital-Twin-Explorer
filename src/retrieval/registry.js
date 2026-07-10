import {
  getMaximumForce,
  getAverageForce,
  getMaximumElongation,
  getExperimentDuration,
  getCurrentMeasurement,
  getMetadata,
  getAvailableColumns
} from "./csvTools.js";

export const toolRegistry = {
  getMaximumForce,
  getAverageForce,
  getMaximumElongation,
  getExperimentDuration,
  getCurrentMeasurement,
  getMetadata,
  getAvailableColumns
};

export function runTool(toolName) {
  const tool = toolRegistry[toolName];

  if (!tool) {
    return {
      error: true,
      message: `Tool "${toolName}" does not exist.`
    };
  }

  return tool();
}