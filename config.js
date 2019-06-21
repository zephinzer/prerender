const path = require('path');

const Case = require('case');
const convict = require('convict');

const PRERENDER_VERSION = require(path.join(__dirname, './node_modules/prerender/package.json')).version

exports = module.exports = convict({
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
