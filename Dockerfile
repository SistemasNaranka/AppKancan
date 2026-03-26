# ===========================
# Etapa 1: Build (más ligera)
# ===========================
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./

# Instalar solo lo necesario
RUN npm install

COPY . .

# Construir
RUN npm run build

# ===========================
# Etapa 2: Producción
# ===========================
FROM node:22-alpine

WORKDIR /app

# Copiar build
COPY --from=builder /app/dist ./dist

# Copiar backend
COPY server ./server

WORKDIR /app/server

# Instalar solo producción
RUN npm install --omit=dev

WORKDIR /app

EXPOSE 11000

ENV PORT=11000
ENV NODE_ENV=production

CMD ["node", "server/index.js"]