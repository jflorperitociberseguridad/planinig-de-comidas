# Planificador de comidas semanales + IA + imágenes

Aplicación web (HTML/CSS/JS puro) para gestionar el planning semanal, generar propuestas con inteligencia artificial y crear imágenes de platillos.

## Funcionalidades

- Alta de comidas por día y tipo (desayuno, comida, cena o snack).
- Persistencia en `localStorage`.
- Lista de compras automática.
- Exportación del plan semanal en JSON.
- Generación de **plan semanal con IA** a partir de un objetivo.
- Generación de **imágenes IA** por cada comida.

## Ver la página en el navegador (local)

```bash
./start-local.sh
```

Abrir: `http://localhost:8080`

## Configurar IA

1. En la tarjeta **Asistente IA**, pega tu API Key.
2. Opcional: cambia modelo de texto e imagen.
3. Escribe tu objetivo (por ejemplo: "alto en proteína y económico").
4. Pulsa **Generar plan con IA**.
5. En cada comida, pulsa **Generar imagen IA**.

> Nota: La API key se guarda en `localStorage` del navegador para uso local.

## Estructura

- `index.html`: interfaz principal.
- `styles.css`: estilos responsive.
- `app.js`: lógica de planificación + IA + imágenes.
- `start-local.sh`: arranque local con servidor HTTP.
