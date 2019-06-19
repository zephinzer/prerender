const fs = require('fs');
const path = require('path');

const logger = require('@mcf/logger');

const bodyParser = require('body-parser');
const Case = require('case');
const compression = require('compression');
const convict = require('convict')
const express = require('express');
const promBundle = require("express-prom-bundle");

const PRERENDER_VERSION = require(path.join(__dirname, './node_modules/prerender/package.json')).version

const config = convict({
  chrome: {
    flags: {
      default: ['--no-sandbox', '--headless', '--disable-gpu', '--remote-debugging-port=9222', '--hide-scrollbars'],
      env: 'CHROME_FLAGS',
    },
    location: {
      default: '/usr/bin/chrome',
      env: 'CHROME_LOCATION',
    },
  },
  log: {
    fluentd: {
      host: {
        default: '',
        env: 'LOG_FLUENTD_HOST',
      },
      port: {
        default: -1,
        env: 'LOG_FLUENTD_PORT',
      },
    },
  },
  prerender: {
    page: {
      done: {
        check: {
          interval: {
            default: 1000,
            env: 'PRERENDER_PAGE_DONE_CHECK_INTERVAL_MS',
          }
        }
      },
      load: {
        timeout: {
          default: 60000,
          env: 'PRERENDER_PAGE_LOAD_TIMEOUT_MS',
        },
      },
    },
    userAgent: {
      default: Case.kebab(Case.lower('prerender-' + PRERENDER_VERSION)),
      env: 'PRERENDER_USER_AGENT',
    },
  },
  server: {
    log: {
      requests: {
        default: true,
        env: 'SERVER_LOG_REQUESTS',
      },
    },
    port: {
      default: 3000,
      env: 'SERVER_PORT',
    },
  },
});

const loggerOptions = {
  additionalTransports: [],
  namespace: 'prerender',
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

// set up the logger
const log = logger.createLogger(loggerOptions)

const prerender = {
  server: require(path.join(process.cwd(), './node_modules/prerender/lib/server')),
  util: require(path.join(process.cwd(), './node_modules/prerender/lib/util')),
};

prerender.util.log = log.info;

// this caches the requests so subsequent loads won't take so long
const hashes = {};
prerender.server.plugins = [];
prerender.server.use({
  init: function() {
    log.info('file caching initialised');
  },
  requestReceived: function(req, res, next) {
    const requestedUrl = req.prerender.url;
    if (hashes[req.prerender.url] !== undefined) {
      log.info(`cache hit for ${req.prerender.url}`, {data: req.prerender.url});
      req.prerender.cacheHit = true;
      res.send(200, hashes[req.prerender.url]);
    } else if (requestedUrl.host === null) {
      log.debug(`skipping for ${req.prerender.url} - not a good url`, {data: req.prerender.url});
      res.send(200, '');
    } else {
      log.warn(`cache miss for ${req.prerender.url}`, {data: req.prerender.url});
      next();
    }
  },
  beforeSend: function(req, res, next) {
    log.info(`url: ${req.prerender.url}, cacheHit: ${req.prerender.cacheHit}, statusCode: ${req.prerender.statusCode}`)
    if (!req.prerender.cacheHit && req.prerender.statusCode === 200) {
      log.info(`setting cache for ${req.prerender.url}`, {data: req.prerender.url});
      hashes[req.prerender.url] = req.prerender.content;
    }
    next();
  },
});

// this initialises the server
const options = {
  chromeFlags: config.get('chrome.flags'),
  chromeLocation: config.get('chrome.location'),
  logRequests: config.get('server.log.requests'),
  pageLoadTimeout: config.get('prerender.page.load.timeout'),
  pageDoneCheckInterval: config.get('prerender.page.done.check.interval'),
  port: config.get('server.port'),
};

const parsedOptions = Object.assign({}, {		
  port: options.port || process.env.PORT || 3000
}, options);

prerender.server.init(options);
prerender.server.onRequest = prerender.server.onRequest.bind(prerender.server);

const app = express();
const metrics = promBundle({
  includeMethod: true,
  includePath: true,
  includeUp: true,
  autoregister: true,
  me
  promClient: {
    collectDefaultMetrics: true,
  },
})
app.disable('x-powered-by');
app.use(compression());
app.get('/metrics', metrics)
app.get('*', prerender.server.onRequest);
app.post('*', bodyParser.json({ type: () => true }), prerender.server.onRequest);
app.listen(parsedOptions, () => prerender.util.log(`Prerender server accepting requests on port ${parsedOptions.port}`))

prerender.server.start();
