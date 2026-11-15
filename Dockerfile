FROM node:22-alpine
WORKDIR /app
COPY --chown=node:node . /app
USER node
ENV NODE_ENV=production PORT=10000
EXPOSE 10000
CMD ["node", "server.mjs"]
