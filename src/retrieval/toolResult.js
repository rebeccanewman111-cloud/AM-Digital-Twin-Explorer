export function toolResult({
  tool,
  value,
  units = "",
  source = "unknown",
  method = "",
  confidence = "direct",
  notes = ""
}) {
  return {
    tool,
    value,
    units,
    source,
    method,
    confidence,
    notes,
    timestamp: new Date().toISOString()
  };
}

export function toolError(tool, message) {
  return {
    tool,
    error: true,
    message,
    timestamp: new Date().toISOString()
  };
}