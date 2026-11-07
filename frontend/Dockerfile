# Etapa 1: genera dist/ con Vite.
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# URL de la API tal como la ve el navegador. Vite la escribe en el codigo al compilar, asi que
# cambiarla exige reconstruir la imagen (docker compose up -d --build).
ARG VITE_API_URL=http://localhost:8080/api/v1
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# Etapa 2: sirve dist/ con nginx.
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
