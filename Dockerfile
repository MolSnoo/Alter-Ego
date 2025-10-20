# syntax=docker.io/docker/dockerfile:1.7-labs

FROM rust:latest AS builder
ENV NODE_ENV development
WORKDIR /home/node/app

RUN apt update -y && apt install nodejs npm -y
RUN node -v
RUN npm -v

COPY . .

RUN npm install
RUN npm run build

FROM node:lts-slim
ENV NODE_ENV production

ARG image_commit
ARG image_tag
ENV IMAGE_COMMIT ${image_commit}
ENV IMAGE_TAG ${image_tag}
ENV PYTHONUNBUFFERED=1

WORKDIR /home/node/app

RUN chown -R node:node /home/node/app
RUN apt-get update && apt-get install -y python3

COPY --from=builder --chown=node:node --exclude=target/ /home/node/app .

CMD [ "python3", "Scripts/launch.py" ]
