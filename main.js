const fs = require('fs');
const path = require('path');

const bodyParser = require('body-parser');
const compression = require('compression');
const express = require('express');
const promBundle = require("express-prom-bundle");

const config = require('./config');
const logger = require('./logger');

// intiialises logger
const log = logger.create('main');

// initialises prerender service
const prerender = {
  server: require(path.join(process.cwd(), './node_modules/prerender/lib/server')),
  util: require(path.join(process.cwd(), './node_modules/prerender/lib/util')),
};

prerender.util.log = logger.create('prerender').debug;

// initialises plugins
const pluginPaths = [
  path.join(__dirname + '/plugins'),
]
prerender.server.plugins = [];
pluginPaths.forEach((pluginDirectory) => {
  if (fs.lstatSync(pluginDirectory).isDirectory()) {
    fs.readdirSync(pluginDirectory)
      .forEach((filename) => {
        if (!/\.js$/.test(filename) || /disabled/gi.test(filename)) return;
        const name = path.basename(filename, '.js');
        const pluginPath = path.join(pluginDirectory, name);
        const plugin = require(pluginPath);
        log.debug(`loading ${pluginPath}`);
        prerender.server.use(plugin);
      });
  }
});

// initialises the prerender application
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

// initialises the server
const app = express();
const metrics = promBundle({
  includeMethod: true,
  includePath: true,
  includeUp: true,
  autoregister: true,
  promClient: {
    collectDefaultMetrics: true,
  },
});

app
  .disable('x-powered-by')
  .use(compression())
  .get('/metrics', metrics)
  .get('*', prerender.server.onRequest)
  .post('*', bodyParser.json({ type: () => true }), prerender.server.onRequest)
  .listen(parsedOptions, () =>
    prerender.util.log(`Prerender server accepting requests on port ${parsedOptions.port}`),
  );

// so it begins...
prerender.server.start();
