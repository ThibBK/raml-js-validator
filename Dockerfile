FROM node:8.9.4-alpine
MAINTAINER Sébastien ISOREZ "sebastien.isorez@backelite.com"
ARG NPM_REGISTRY=https://registry.npmjs.org/
ARG APP_GROUP=app
ARG APP_GID=101
ARG APP_USER=app
ARG APP_UID=101
ARG APP_HOME=/usr/src/app
ARG TZ=Europe/Paris
# Timezone
RUN apk update && \
    apk add tzdata && \
    cp /usr/share/zoneinfo/${TZ} /etc/localtime && \
    echo "${TZ}" >  /etc/timezone && \
    apk del tzdata
# App home
WORKDIR ${APP_HOME}
# Specific account
RUN addgroup -S -g ${APP_GID} ${APP_GROUP} && \
    adduser -h ${APP_HOME} -G ${APP_GROUP} -s /bin/ash -S -u ${APP_UID} ${APP_USER}
# Install app dependencies
COPY package.json .
RUN npm config set registry ${NPM_REGISTRY}
RUN npm install
RUN npm config delete registry
# Bundle app source
COPY . .
# Fix rights
RUN chown -R ${APP_USER}:${APP_GROUP} ${APP_HOME}
USER ${APP_USER}
# Default port
EXPOSE 3000
CMD [ "npm", "start" ]