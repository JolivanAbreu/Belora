# Imagem de produção da Belora API.
# Uso: docker build -t belora-api . && docker run --env-file .env -p 3000:3000 belora-api
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "src/server.js"]
