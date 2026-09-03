# Imagem de produção do painel admin (build estático servido por nginx).
# Uso: docker build -t belora-admin --build-arg VITE_API_URL=https://sua-api.com -t belora-admin .
FROM node:20-alpine AS build
WORKDIR /app
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
