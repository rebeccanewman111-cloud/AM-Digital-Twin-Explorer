import { digitalTwinStore } from "./dataStore.js";
import { toolResult, toolError } from "./toolResult.js";

function findColumn(possibleNames) {
  const columns = digitalTwinStore.getColumns();

  return columns.find(col =>
    possibleNames.some(name =>
      col.toLowerCase().includes(name.toLowerCase())
    )
  );
}

function numericValues(columnName) {
  const rows = digitalTwinStore.getRows();

  return rows
    .map(row => Number(row[columnName]))
    .filter(value => !Number.isNaN(value));
}

export function getMaximumForce() {
  const column = findColumn(["force", "load"]);

  if (!column) {
    return toolError("getMaximumForce", "No force/load column found.");
  }

  const values = numericValues(column);
  const max = Math.max(...values);

  return toolResult({
    tool: "getMaximumForce",
    value: max,
    units: "N",
    source: digitalTwinStore.getSourceName(),
    method: `maximum(${column})`
  });
}

export function getAverageForce() {
  const column = findColumn(["force", "load"]);

  if (!column) {
    return toolError("getAverageForce", "No force/load column found.");
  }

  const values = numericValues(column);
  const avg = values.reduce((sum, value) => sum + value, 0) / values.length;

  return toolResult({
    tool: "getAverageForce",
    value: avg,
    units: "N",
    source: digitalTwinStore.getSourceName(),
    method: `average(${column})`
  });
}

export function getMaximumElongation() {
  const column = findColumn(["elongation", "extension", "displacement"]);

  if (!column) {
    return toolError("getMaximumElongation", "No elongation/extension column found.");
  }

  const values = numericValues(column);
  const max = Math.max(...values);

  return toolResult({
    tool: "getMaximumElongation",
    value: max,
    units: "mm",
    source: digitalTwinStore.getSourceName(),
    method: `maximum(${column})`
  });
}

export function getExperimentDuration() {
  const timeColumn = findColumn(["time", "second", "duration"]);

  if (!timeColumn) {
    return toolError("getExperimentDuration", "No time column found.");
  }

  const values = numericValues(timeColumn);
  const duration = Math.max(...values) - Math.min(...values);

  return toolResult({
    tool: "getExperimentDuration",
    value: duration,
    units: "s",
    source: digitalTwinStore.getSourceName(),
    method: `max(${timeColumn}) - min(${timeColumn})`
  });
}

export function getCurrentMeasurement() {
  const row = digitalTwinStore.getCurrentRow();

  if (!row) {
    return toolError("getCurrentMeasurement", "No current playback row available.");
  }

  return toolResult({
    tool: "getCurrentMeasurement",
    value: row,
    source: digitalTwinStore.getSourceName(),
    method: "current playback index"
  });
}

export function getMetadata() {
  return toolResult({
    tool: "getMetadata",
    value: digitalTwinStore.getMetadata(),
    source: digitalTwinStore.getSourceName(),
    method: "metadata extraction"
  });
}

export function getAvailableColumns() {
  return toolResult({
    tool: "getAvailableColumns",
    value: digitalTwinStore.getColumns(),
    source: digitalTwinStore.getSourceName(),
    method: "column listing"
  });
}