# Prerender Image

This repository contains a Prerender deployment packaged in a Docker image.

# Quick Use

Run:

```sh
docker run -it -p 3000:3000 zephinzer/prerender:latest;
```

Open your browser:

```sh
xdg-open "http://localhost:3000/https://www.mycareersfuture.sg"
```

# Get Started

## Install Pre-Requisites

- [Docker]()

## Install Dependencies

```sh
# run this in the repository root
npm install
```

## Run locally

> Find out where you Chrome browser is and replace the variable below with the full absolute path of your Chrome

```sh
CHROME_LOCATION=/path/to/chrome npm start
```

## Build Docker image

```sh
# run this in the repository root
docker build -t zephinzer/prerender:latest .
```

## Run Docker container

```sh
# run this in the repository root
docker run -it -v $(pwd):/app -v $(pwd)/node_modules:/app/node_modules -p 3000:3000 zephinzer/prerender:latest;
```

# Configuration

| Environment Variable | Description |
| --- | --- |
| `CHROME_FLAGS` | Defines the flags to start Chrome with. Defaults to `--no-sandbox --headless --disable-gpu --remote-debuggingport=9222 --hide-scrollbars` |
| `CHROME_LOCATION` | Defines the absolute path to the location of Chrome. Defaults to `/usr/bin/chrome` |
| `LOG_FLUENTD_HOST` | Defines the host where the FluentD service can be found. Defaults to `""` - if left as default, disables FluentD |
| `LOG_FLUENTD_PORT` | Defines the port where the FluentD service can be found. Defaults to `-1` - if left as default, disables FluentD |
| `PRERENDER_PAGE_DONE_CHECK_INTERVAL_MS` | Defines the intervals in milliseconds between which prerender will attempt to verify that the page is done loading. Defaults to `1000` |
| `PRERENDER_PAGE_LOAD_TIMEOUT_MS` | Defines the page load timeout in milliseconds. Defaults to `60000` |
| `PRERENDER_USER_AGENT` | Defines the user agent header used by prerender. Defaults to `prerender-${PRERENDER_VERSION}` |
| `SERVER_LOG_REQUESTS` | Defines whether prerender should log requests. Defaults to `true` |
| `SERVER_PORT` | Defines the port on which the container will listen on for connections. Defaults to `3000` |

# License

Code herein is licensed under [the permissive MIT license](./LICENSE)
