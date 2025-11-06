// Optional hooks for diagnostics / analytics
export function makeTelemetryHooks(opts = {}) {
  const {
    onLatency = () => {},
    onError = () => {},
    onStateChange = () => {},
  } = opts;
  return { onLatency, onError, onStateChange };
}
