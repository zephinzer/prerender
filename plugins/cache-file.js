const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const url = require('url');

const logger = require('../logger');
const log = logger.create('plugin_cache_file');

const plugin = {};

plugin.data = {
  cachePath: path.join(process.cwd(), '/data/cache-file'),
};

plugin.init = function() {
  let error;
  log.debug(`file caching initialised, using directory '${plugin.data.cachePath}'`);
  try {
    if (!fs.lstatSync(plugin.data.cachePath).isDirectory()) {
      error = `${plugin.data.cachePath} is not a directory`;
    }
  } catch(ex) {
    error = ex;
  }
  if (error) {
    log.warn(`file cache directory '${plugin.data.cachePath}' is not accessible - ${error}`);
  }
};

plugin.requestReceived = function(req, res, next) {
    req.prerender.requestedUrl = url.parse(req.prerender.url);
    req.prerender.cacheHash = crypto
      .createHash('sha256')
      .update(req.prerender.url)
      .digest('hex')
      .toString('utf8');
    req.prerender.cacheHit = false;
    const cacheSubpath = path.join(plugin.data.cachePath, `/${req.prerender.requestedUrl.host}`);
    try {
      fs.mkdirSync(cacheSubpath)
      log.info(`cache subpath created at ${cacheSubpath}`);
    } catch(ex) {
      log.debug(`cache subpath found at ${cacheSubpath}, skipping creation`);
    }
    try {
      req.prerender.cachePath = path.join(plugin.data.cachePath, `/${req.prerender.requestedUrl.host}/${req.prerender.cacheHash}.html`);
      req.prerender.cacheHit = fs.lstatSync(path.join(req.prerender.cachePath)).isFile();
    } catch(ex) {
      log.warn(`error checking out file hash - ${ex}`, {data: ex})
    }
    if (req.prerender.requestedUrl.host === null) {
      log.debug(`skipping for ${req.prerender.url} - not a well-formed url`, {data: req.prerender.url});
      res.send(200, '');
    } else if (req.prerender.cacheHit === true) {
      log.info(`cache hit for ${req.prerender.url}`, {data: req.prerender.url});
      fs.readFile(path.join(req.prerender.cachePath), (err, data) => {
        if (err) {
          log.warn(`error reading cache - ${req.prerender.cachePath} - ${err}`, {data: err});
        } else {
          res.send(200, data);
        }
      });
    } else {
      req.prerender.skipped = true;
      log.info(`cache miss for ${req.prerender.url}`, {data: req.prerender.url});
      next();
    }
};

plugin.beforeSend = function(req, _res, next) {
    log.debug(`url: ${req.prerender.url}, skipped: ${req.prerender.skipped}, cacheHit: ${req.prerender.cacheHit}, statusCode: ${req.prerender.statusCode}`)
    if (req.prerender.requestedUrl.host !== null && !req.prerender.cacheHit && req.prerender.statusCode === 200) {
      log.info(`setting cache for ${req.prerender.url}`, {data: req.prerender.url});
      fs.writeFile(req.prerender.cachePath, req.prerender.content, (err) => {
        if (err) {
          log.warn(`error setting cache - ${req.prerender.url} - ${err}`, {data: err});
        }
      });
      plugin.data[req.prerender.url] = req.prerender.content;
    }
    next();
};

exports = module.exports = plugin;
