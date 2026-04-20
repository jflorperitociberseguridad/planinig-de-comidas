# Planificador de comidas semanales

Aplicación web (HTML/CSS/JS puro) para gestionar el planning de comidas de la semana en local.

## Funcionalidades

- Alta de comidas por día y tipo (desayuno, comida, cena o snack).
- Edición rápida mediante borrado por cada comida.
- Persistencia de datos en `localStorage`.
- Lista de compras generada automáticamente a partir de ingredientes.
- Exportación del plan semanal en formato JSON.
- Limpieza completa del plan semanal.

## Ejecutar en local

### Opción rápida (sin instalar nada adicional)

```bash
./start-local.sh
```

Abre: `http://localhost:8080`

También puedes elegir puerto:

```bash
./start-local.sh 3000
```

Abre: `http://localhost:3000`

### Opción con npm

```bash
npm start
```

## Estructura

- `index.html`: interfaz principal.
- `styles.css`: estilos responsive.
- `app.js`: lógica de planificación, persistencia y lista de compras.
- `start-local.sh`: arranque local con servidor HTTP.
