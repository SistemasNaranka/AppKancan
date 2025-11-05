# ===========================
# Etapa 1: Build (Node Debian)
# ===========================
FROM node:20-bullseye-slim AS builder

WORKDIR /app

# Copiar solo package.json primero
COPY package*.json ./

# ⚙️ Instalar dependencias sin usar el lockfile de Windows
RUN npm install --no-optional --force

# Copiar el resto del código
COPY . .

# ⚙️ Instalar manualmente la versión nativa de rollup
RUN npm install @rollup/rollup-linux-x64-gnu --force

# 🔧 Construir el proyecto
RUN npm run build

# ===========================
# Etapa 2: Producción (NGINX Alpine)
# ===========================
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html

RUN echo 'server { \
    listen 11000; \
    root /usr/share/nginx/html; \
    index index.html; \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 11000

CMD ["nginx", "-g", "daemon off;"]
