# Planificador de comidas semanales

Aplicación web (HTML/CSS/JS puro) para gestionar el planning de comidas de la semana en local.

## Funcionalidades

- Alta de comidas por día y tipo (desayuno, comida, cena o snack).
- Edición rápida mediante borrado por cada comida.
- Persistencia de datos en `localStorage`.
- Lista de compras generada automáticamente a partir de ingredientes.
- Exportación del plan semanal en formato JSON.
- Limpieza completa del plan semanal.

## Ver la página en el navegador (local)

### Opción rápida (sin instalar nada adicional)

```bash
./start-local.sh
```

Luego abre en tu navegador:

- `http://localhost:8080`

### Si estás en VM/WSL/Docker/servidor remoto

Inicia escuchando en todas las interfaces:

```bash
./start-local.sh 0.0.0.0 8080
```

Después abre desde tu máquina host:

- `http://localhost:8080` (si hay reenvío de puertos)
- o la URL de red que imprime el script en consola.

### Opción con npm

```bash
npm start
```

## Estructura

- `index.html`: interfaz principal.
- `styles.css`: estilos responsive.
- `app.js`: lógica de planificación, persistencia y lista de compras.
- `start-local.sh`: arranque local con servidor HTTP.
