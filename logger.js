const logger = require('@mcf/logger');

const config = require('./config');

module.exports = {
  create,
}

function create(name) {
  const loggerOptions = {
    additionalTransports: [],
    namespace: `prerender${name?`_${name}`:''}`,
  };
  
  if (config.get('log.fluentd.host').length !== 0 && config.get('log.fluentd.port') !== 0) {
    loggerOptions.additionalTransports.push(
      logger.createFluentTransport({
        host: config.get('log.fluentd.host'),
        port: config.get('log.fluentd.port'),
        timeout: 5.0,
        requireAckResponse: true,
      }),
    );
  }

  return logger.createLogger(loggerOptions);
}