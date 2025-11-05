#!/bin/bash

# ==========================================

# 🐳 COMANDOS DOCKER PARA TU APLICACIÓN

# ==========================================

# 1️⃣ Construir la imagen (esto puede tomar unos minutos)

docker build -t appkancan:latest .

# 2️⃣ Ver el tamaño de la imagen

docker images appkancan:latest

# 3️⃣ Ejecutar el contenedor en puerto 11000

docker run -d -p 11000:11000 --name appkancan-container appkancan:latest

# 4️⃣ Ver logs del contenedor

docker logs -f appkancan-container

# 5️⃣ Verificar que está corriendo

docker ps

# 6️⃣ Acceder a la aplicación

# Abre en el navegador: http://localhost:11000

# ==========================================

# 🔧 COMANDOS ÚTILES

# ==========================================

# Detener el contenedor

docker stop appkancan-container

# Iniciar el contenedor detenido

docker start appkancan-container

# Eliminar el contenedor

docker rm appkancan-container

# Eliminar la imagen

docker rmi appkancan:latest

# Ver uso de recursos

docker stats appkancan-container

# Entrar al contenedor (para debug)

docker exec -it appkancan-container sh

# ==========================================

# 🚀 PRODUCCIÓN - DOCKER HUB

# ==========================================

# Hacer login en Docker Hub

docker login

# Etiquetar la imagen para Docker Hub

docker tag appkancan:latest tu-usuario/appkancan:latest
docker tag appkancan:latest tu-usuario/appkancan:1.0.0

# Subir a Docker Hub

docker push tu-usuario/appkancan:latest
docker push tu-usuario/appkancan:1.0.0

# Descargar desde otro servidor

docker pull tu-usuario/appkancan:latest

# ==========================================

# 📦 OPTIMIZACIÓN - Construir sin caché

# ==========================================

docker build --no-cache -t appkancan:latest .

# ==========================================

# 🔍 INSPECCIONAR LA IMAGEN

# ==========================================

# Ver capas de la imagen

docker history appkancan:latest

# Analizar tamaño con dive (instalar primero: https://github.com/wagoodman/dive)

# dive appkancan:latest
