FROM node:lts-slim
ENV NODE_ENV production

ARG image_tag
ENV IMAGE_TAG ${image_tag}
ENV PYTHONUNBUFFERED=1

WORKDIR /home/node/app

COPY package*.json ./

RUN chown -R node:node /home/node/app
RUN apt-get update && apt-get install -y python3

USER node

RUN npm install

COPY --chown=node:node . .

CMD [ "python3", "Scripts/launch.py" ]