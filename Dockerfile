FROM node:lts-slim
ENV NODE_ENV production

WORKDIR /home/node/app

COPY package*.json ./

RUN chown -R node:node /home/node/app

USER node

RUN npm install

COPY --chown=node:node . .

CMD [ "node", "bot.js" ]