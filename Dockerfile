FROM node:8-alpine

RUN mkdir -p /app

WORKDIR /app

ADD package.json /app
RUN yarn install && yarn cache clean

ENV PORT 5000

COPY . /app

EXPOSE $PORT
ENTRYPOINT [ "yarn" ]
