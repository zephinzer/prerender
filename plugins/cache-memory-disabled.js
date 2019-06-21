const url = require('url');

const logger = require('../logger');
const log = logger.create('plugin_cache_memory');

const plugin = {};

plugin.data = {},
plugin.init = function() {
    log.debug('memory caching initialised');
};

plugin.requestReceived = function(req, res, next) {
  req.prerender.requestedUrl = url.parse(req.prerender.url);
  if (requestedUrl.host === null) {
    log.debug(`skipping for ${req.prerender.url} - not a good url`, {data: req.prerender.url});
    res.send(200, '');
  } else if (plugin.data[req.prerender.url] !== undefined) {
    log.info(`cache hit for ${req.prerender.url}`, {data: req.prerender.url});
    req.prerender.cacheHit = true;
    res.send(200, plugin.data[req.prerender.url]);
  } else {
    log.info(`cache miss for ${req.prerender.url}`, {data: req.prerender.url});
    next();
  }
};

plugin.beforeSend = function(req, _res, next) {
    log.debug(`url: ${req.prerender.url}, cacheHit: ${req.prerender.cacheHit}, statusCode: ${req.prerender.statusCode}`)
    if (!req.prerender.cacheHit && req.prerender.statusCode === 200) {
      log.info(`setting cache for ${req.prerender.url}`, {data: req.prerender.url});
      plugin.data[req.prerender.url] = req.prerender.content;
    }
    next();
};

exports = module.exports = plugin;
