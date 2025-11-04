# ===========================
# 🏗️ Etapa 1: Construcción
# ===========================
FROM node:20-alpine AS build

WORKDIR /app

# Copiar archivos necesarios para instalar dependencias
COPY package*.json ./

# Instalar dependencias exactas (más rápido y confiable que npm install)
RUN npm ci

# Copiar el resto del proyecto
COPY . .

# Compilar la aplicación (Vite)
RUN npm run build


# ===========================
# 🚀 Etapa 2: Producción
# ===========================
FROM node:20-alpine AS production

WORKDIR /app

# Instalar servidor estático
RUN npm i -g serve

# Copiar solo la carpeta de build desde la etapa anterior
COPY --from=build /app/dist ./dist

# Exponer el puerto de producción
EXPOSE 11000

# Servir la app
CMD ["serve", "-s", "dist", "-l", "11000"]
