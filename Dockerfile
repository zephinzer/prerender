FROM node:12-slim
RUN apt-get -y update --fix-missing && apt-get -y upgrade
# install chrome
RUN wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add -
RUN echo 'deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main' | tee /etc/apt/sources.list.d/google-chrome.list
RUN apt-get -y update
RUN apt-get -y install google-chrome-stable
# install a virtual desktop
RUN apt-get -y install xvfb
# application-level stuff
WORKDIR /app
COPY ./package.json .
COPY ./package-lock.json .
RUN npm install
COPY . /app
ENTRYPOINT ["node", "/app/main.js"]
USER node
ENV CHROME_LOCATION="/opt/google/chrome/chrome"