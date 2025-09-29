FROM node:22-alpine AS builder

ARG http_proxy
ARG https_proxy

USER node
WORKDIR /home/node

RUN npm config set proxy $http_proxy
RUN npm config set https-proxy $https_proxy

COPY package*.json ./
RUN npm ci

COPY --chown=node:node . .

RUN npm run compile && npm prune --production

FROM node:22-alpine AS label-back

USER node
WORKDIR /home/node

COPY --from=builder --chown=node:node /home/node/dist ./dist
COPY --from=builder --chown=node:node /home/node/node_modules ./node_modules
COPY --from=builder --chown=node:node /home/node/src/courDeCassation/settings ./settings

CMD [ "node", "dist/courDeCassation/labelServer.js", "-s", "settings/settings.json" ]
