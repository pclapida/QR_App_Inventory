-- Ejecutar esto en psql como superusuario (postgres)
-- Abre pgAdmin o psql y pega estos comandos:

-- 1. Crear el usuario de la app
CREATE USER inventory_user WITH PASSWORD 'inventory_pass';

-- 2. Crear la base de datos
CREATE DATABASE qr_inventory OWNER inventory_user;

-- 3. Dar permisos
GRANT ALL PRIVILEGES ON DATABASE qr_inventory TO inventory_user;
