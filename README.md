# Chat App

Este proyecto es una aplicación de chat en tiempo real.

## 📌 Estructura del Proyecto
- `chat_app_backend/` → API backend construida con **Rails** y **MySQL**.
- `chat_app_frontend/` → Aplicación frontend construida con **Angular**.

## 🚀 Cómo ejecutar el proyecto

Clonar el repositorio:

```bash
git clone https://github.com/TU_USUARIO/chat_app.git
cd chat_app
```

## 🔧 Configuración del Backend (Rails + MySQL)

1. Ir al directorio del backend:

```bash
cd chat_app_backend
```

2. Instalar las dependencias de Ruby:
```bash
bundle install
```

3. Configurar la base de datos:

```bash
rails db:create
rails db:migrate
```

4. Iniciar MySQL:
```bash
service mysql
```

5. Iniciar servidor de Rails
```bash
rails s
```

## 🔧 Configuración del Frontend (Angular)

1. Ir al directorio del frontend:
```bash
cd chat_app_frontend
```

2. Instalar las dependencias de Node.js:
```bash
npm install
```

3. Iniciar el servidor de Angular:
```bash
ng serve
```

## 📝 Documentación API

La API está documentada en el archivo api.yaml siguiendo la especificación de OpenAPI.
