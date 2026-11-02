// One JSON object per line on stderr, so it never mixes with the chat output on stdout.
export const logger = {
  log(level, event, fields = {}) {
    console.error(JSON.stringify({ ts: new Date().toISOString(), level, event, ...fields }));
  },
  info: (event, fields) => logger.log("info", event, fields),
  warn: (event, fields) => logger.log("warn", event, fields),
  error: (event, fields) => logger.log("error", event, fields),
};
