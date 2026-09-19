# Sistema de Turnos y Reservas - Administrador de servicios

Proyecto Node.js (ESM) que implementa una clase `ServiceManager` para gestionar los servicios de un sistema de turnos y reservas. Los datos se guardan en `src/data/services.json`. Incluye un servidor Express con una API basica para consultar los servicios.

## Instalacion

1. Clonar el repositorio:

```bash
git clone <URL-DEL-REPOSITORIO>
cd <NOMBRE-DE-LA-CARPETA>
```

2. Instalar las dependencias:

```bash
npm install
```

3. Crear el archivo `.env` a partir de `.env.example` y completar los valores (ver la seccion siguiente).

## Variables de entorno

| Variable   | Descripcion                          | Ejemplo       |
| ---------- | ------------------------------------ | ------------- |
| `PORT`     | Puerto donde escucha el servidor     | `8080`        |
| `NODE_ENV` | Entorno de ejecucion                 | `development` |

Ejemplo de `.env`:

```
PORT=8080
NODE_ENV=development
```

Si falta alguna variable, la aplicacion no arranca y muestra un mensaje indicando cual falta.

## Ejecucion

Modo normal:

```bash
npm start
```

Modo desarrollo (reinicia al guardar cambios):

```bash
npm run dev
```

Con el servidor levantado, `GET http://localhost:8080/api/services` devuelve la lista de servicios.

## Recurso `services`

Cada servicio tiene la siguiente forma:

| Campo         | Tipo    | Descripcion                                         |
| ------------- | ------- | --------------------------------------------------- |
| `id`          | number  | Se genera automaticamente, no se recibe desde afuera |
| `name`        | string  | Nombre del servicio                                 |
| `description` | string  | Descripcion del servicio                            |
| `duration`    | number  | Duracion en minutos                                 |
| `price`       | number  | Precio                                              |
| `category`    | string  | Categoria del servicio                              |
| `available`   | boolean | Si el servicio esta disponible para reservar        |

Ejemplo:

```json
{
    "id": 1,
    "name": "Consulta medica general",
    "description": "Consulta con medico general para evaluacion y seguimiento de salud",
    "duration": 30,
    "price": 900,
    "category": "salud",
    "available": true
}
```

## Metodos de ServiceManager

```js
import ServiceManager from './src/managers/ServiceManager.js';

const manager = new ServiceManager();
```

Todos los metodos son asincronos (usan `await`).

### `getServices()`

Devuelve todos los servicios.

```js
const services = await manager.getServices();
console.log(services);
```

### `getServiceById(id)`

Devuelve el servicio con ese id, o `null` si no existe.

```js
const service = await manager.getServiceById(1);
const notFound = await manager.getServiceById(999); // null
```

### `addService(serviceData)`

Agrega un servicio y lo devuelve con su `id` generado automaticamente. Los campos `name`, `description`, `duration`, `price`, `category` y `available` son obligatorios; si falta alguno lanza un `Error` indicando cuales.

```js
const created = await manager.addService({
    name: 'Consulta nutricional',
    description: 'Evaluacion y plan alimentario personalizado',
    duration: 40,
    price: 1000,
    category: 'salud',
    available: true
});

try {
    await manager.addService({ name: 'Incompleto' });
} catch (error) {
    console.log(error.message); // Servicio incompleto. Faltan los campos: ...
}
```

### `updateService(id, updatedData)`

Actualiza los campos indicados y devuelve el servicio actualizado. El `id` no se puede modificar. Devuelve `null` si el servicio no existe.

```js
const updated = await manager.updateService(2, { price: 1300, available: false });
const notFound = await manager.updateService(999, { price: 1 }); // null
```

### `deleteService(id)`

Elimina el servicio y lo devuelve. Devuelve `null` si no existe.

```js
const deleted = await manager.deleteService(3);
const notFound = await manager.deleteService(999); // null
```

## Estructura del proyecto

```
src/
  config/env.config.js
  managers/ServiceManager.js
  data/services.json
  app.js
package.json
.env.example
.gitignore
README.md
```
