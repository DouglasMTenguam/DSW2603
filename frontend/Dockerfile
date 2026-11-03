<<<<<<< HEAD
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY index.html /usr/share/nginx/html/index.html
EXPOSE 4200
=======
# ---------- etapa 1: gera o build do Angular ----------
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---------- etapa 2: serve os arquivos estáticos com nginx ----------
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/diario/browser /usr/share/nginx/html
EXPOSE 80
>>>>>>> b36e75e9c3f5783942167cc0d157db421f74a23c
