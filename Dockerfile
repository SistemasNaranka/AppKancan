# ===========================
# Etapa 1: Build (Node Debian)
# ===========================
FROM node:20-bullseye-slim AS builder

WORKDIR /app

# Copiar package.json del proyecto principal
COPY package*.json ./

# Instalar dependencias
RUN npm install --no-optional --force

# Copiar el resto del código
COPY . .

# Instalar versión nativa de rollup para Linux
RUN npm install @rollup/rollup-linux-x64-gnu --force

# Construir el proyecto frontend
RUN npm run build

# ===========================
# Etapa 2: Producción (Node.js)
# ===========================
FROM node:20-bullseye-slim

WORKDIR /app

# Copiar archivos del frontend construido
COPY --from=builder /app/dist ./dist

# Copiar el servidor backend
COPY server ./server

# Instalar dependencias del servidor
WORKDIR /app/server
RUN npm install --production

# Volver al directorio principal
WORKDIR /app

# Exponer puerto
EXPOSE 11000

# Variables de entorno
ENV PORT=11000
ENV NODE_ENV=production

# Iniciar el servidor unificado (frontend + API)
CMD ["node", "server/index.js"]
