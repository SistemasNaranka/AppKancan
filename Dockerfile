# ===========================
# Etapa 1: Build (Frontend)
# ===========================
FROM node:22-alpine AS builder

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalación de dependencias de build
RUN npm install

# Copiar todo el código fuente del frontend y compilar
COPY . .
RUN npm run build

# ===========================
# Etapa 2: Producción (Servidor unificado)
# ===========================
FROM node:22-alpine AS runner

WORKDIR /app

# Definir variables de entorno de producción
ENV PORT=11000 \
    NODE_ENV=production

# Copiar archivos estáticos del frontend desde el builder
COPY --from=builder /app/dist ./dist

# Copiar el backend Express
COPY server ./server

# Instalar ÚNICAMENTE dependencias de producción del backend
WORKDIR /app/server
RUN npm install --omit=dev && npm cache clean --force

# Volver a la raíz de la aplicación
WORKDIR /app

# Cambiar propiedad de archivos al usuario no privilegiado 'node'
RUN chown -R node:node /app
USER node

EXPOSE 11000

CMD ["node", "server/index.js"]