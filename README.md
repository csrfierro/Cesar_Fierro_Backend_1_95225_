# Sistema de Turnos y Reservas - API de servicios y reservas

API REST con Node.js (ESM), Express y FileSystem para gestionar los **servicios** disponibles de un sistema de turnos y las **reservas** que hacen los clientes. Los datos se persisten en archivos JSON dentro de `src/data/`, por lo que no se pierden al reiniciar el servidor.

## Instalación

1. Clonar el repositorio:

```bash
git clone <URL-DEL-REPOSITORIO>
cd <NOMBRE-DE-LA-CARPETA>
```

2. Instalar las dependencias:

```bash
npm install
```

3. Crear el archivo `.env` a partir de `.env.example` y completar los valores (ver la sección siguiente).

## Variables de entorno

| Variable   | Descripción                      | Ejemplo       |
| ---------- | -------------------------------- | ------------- |
| `PORT`     | Puerto donde escucha el servidor | `8080`        |
| `NODE_ENV` | Entorno de ejecución             | `development` |

Ejemplo de `.env`:

```
PORT=8080
NODE_ENV=development
```

Si falta alguna variable, la aplicación no arranca y muestra un mensaje indicando cuál falta.

## Ejecución

Modo normal:

```bash
npm start
```

Modo desarrollo (reinicia al guardar cambios):

```bash
npm run dev
```

Con el servidor levantado, `GET http://localhost:8080/` devuelve un mensaje de estado y `GET http://localhost:8080/api/services` devuelve la lista de servicios.

## Formato de las respuestas

Todas las respuestas son JSON con una de estas dos formas:

```json
{ "status": "correcto", "payload": "..." }
```

```json
{ "status": "error", "message": "descripción del error" }
```

| Código | Cuándo ocurre                                                         |
| ------ | --------------------------------------------------------------------- |
| `200`  | La petición se resolvió correctamente                                 |
| `201`  | Se creó un recurso nuevo                                              |
| `400`  | Datos inválidos: campos faltantes, tipos incorrectos, id no numérico  |
| `404`  | El recurso (servicio, reserva o ruta) no existe                       |
| `500`  | Error interno del servidor (por ejemplo, falla al leer el archivo)    |

## Recurso `services`

Cada servicio tiene la siguiente forma:

| Campo         | Tipo    | Validación                                              |
| ------------- | ------- | ------------------------------------------------------- |
| `id`          | number  | Se genera automáticamente; **no** se puede enviar       |
| `name`        | string  | Texto no vacío                                          |
| `description` | string  | Texto no vacío                                          |
| `duration`    | number  | Duración en minutos, número mayor a 0                   |
| `price`       | number  | Número mayor a 0                                        |
| `category`    | string  | Texto no vacío                                          |
| `available`   | boolean | `true` o `false` (no se aceptan textos como `"true"`)   |

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

### Endpoints de `services`

| Método   | Ruta                    | Descripción                                    |
| -------- | ----------------------- | ---------------------------------------------- |
| `GET`    | `/api/services`         | Devuelve todos los servicios (admite filtros)  |
| `GET`    | `/api/services/:sid`    | Devuelve un servicio por id                    |
| `POST`   | `/api/services`         | Crea un servicio                               |
| `PUT`    | `/api/services/:sid`    | Actualiza un servicio                          |
| `DELETE` | `/api/services/:sid`    | Elimina un servicio y lo devuelve              |

#### `GET /api/services` con filtros

Se pueden combinar dos filtros opcionales por query params:

| Parámetro   | Ejemplo               | Efecto                                   |
| ----------- | --------------------- | ---------------------------------------- |
| `category`  | `?category=salud`     | Solo los servicios de esa categoría      |
| `available` | `?available=true`     | Solo disponibles (`true`) o no (`false`) |

```
GET /api/services?category=salud&available=true
```

#### `POST /api/services`

Todos los campos son obligatorios y se valida su tipo. El `id` no se envía: si viene en el body, se rechaza con `400`.

```json
{
    "name": "Consulta nutricional",
    "description": "Evaluacion y plan alimentario personalizado",
    "duration": 40,
    "price": 1000,
    "category": "salud",
    "available": true
}
```

Respuesta `201`: el servicio creado, con su `id` generado. Ejemplos de error `400`:

```json
{ "status": "error", "message": "Servicio incompleto. Faltan los campos: price, available" }
```

```json
{ "status": "error", "message": "Datos invalidos: price debe ser un numero mayor a 0, available debe ser true o false" }
```

#### `PUT /api/services/:sid`

Se puede enviar solo los campos a modificar; los que se envíen se validan con las mismas reglas que en el `POST`. Si el body trae un `id`, se ignora (el id nunca cambia).

```json
{ "price": 1300, "available": false }
```

Devuelve `200` con el servicio actualizado, `400` si algún campo es inválido o `404` si el servicio no existe.

## Recurso `bookings`

Cada reserva tiene la siguiente forma:

| Campo         | Tipo   | Descripción                                                                 |
| ------------- | ------ | --------------------------------------------------------------------------- |
| `id`          | number | Se genera automáticamente; **no** se puede enviar                           |
| `clientName`  | string | Nombre del cliente (obligatorio)                                            |
| `clientEmail` | string | Email del cliente (obligatorio)                                             |
| `date`        | string | Fecha de la reserva (obligatorio)                                           |
| `time`        | string | Hora de la reserva (obligatorio)                                            |
| `status`      | string | Estado de la reserva (opcional; si no se envía vale `"pendiente"`)          |
| `services`    | array  | Servicios de la reserva: `{ "service": idDelServicio, "quantity": 1 }`      |

Ejemplo:

```json
{
    "id": 1,
    "clientName": "Ana Perez",
    "clientEmail": "ana@mail.com",
    "date": "2026-10-10",
    "time": "10:00",
    "status": "pendiente",
    "services": [
        { "service": 2, "quantity": 2 },
        { "service": 3, "quantity": 1 }
    ]
}
```

### Endpoints de `bookings`

| Método | Ruta                                  | Descripción                                          |
| ------ | ------------------------------------- | ---------------------------------------------------- |
| `GET`  | `/api/bookings`                       | Devuelve todas las reservas (admite el filtro `status`) |
| `POST` | `/api/bookings`                       | Crea una reserva (siempre inicia con `services` vacío) |
| `GET`  | `/api/bookings/:bid`                  | Devuelve una reserva por id                          |
| `POST` | `/api/bookings/:bid/services/:sid`    | Agrega un servicio a una reserva existente           |

#### `GET /api/bookings` con filtro

Filtro opcional por query param: `?status=confirmado` devuelve solo las reservas con ese estado.

```
GET /api/bookings?status=pendiente
```

#### `POST /api/bookings`

```json
{
    "clientName": "Ana Perez",
    "clientEmail": "ana@mail.com",
    "date": "2026-10-10",
    "time": "10:00"
}
```

Devuelve `201` con la reserva creada y `services: []`. Si falta algún campo obligatorio o se envía un `id`, devuelve `400`.

#### `POST /api/bookings/:bid/services/:sid`

No lleva body. Valida que existan **tanto la reserva como el servicio** (`404` si alguno no existe). Si el servicio ya estaba en la reserva, se incrementa su `quantity` en 1 en lugar de duplicarlo.

```
POST /api/bookings/1/services/2   ->  services: [{ "service": 2, "quantity": 1 }]
POST /api/bookings/1/services/2   ->  services: [{ "service": 2, "quantity": 2 }]
```

## Managers

Los managers contienen la lógica de lectura y escritura de los archivos JSON. Todos sus métodos son asíncronos (usan `await`) y reciben opcionalmente la ruta del archivo en el constructor (por defecto usan el de `src/data/`).

```js
import ServiceManager from './src/managers/ServiceManager.js';
import BookingManager from './src/managers/BookingManager.js';

const serviceManager = new ServiceManager();
const bookingManager = new BookingManager();
```

### `ServiceManager`

| Método                          | Devuelve                                                                         |
| ------------------------------- | -------------------------------------------------------------------------------- |
| `getServices({ category, available })` | Array de servicios; los filtros son opcionales                            |
| `getServiceById(id)`            | El servicio, o `null` si no existe                                               |
| `addService(serviceData)`       | El servicio creado con su `id`; lanza `ValidationError` si faltan campos o son inválidos |
| `updateService(id, updatedData)`| El servicio actualizado, o `null` si no existe; lanza `ValidationError` si hay tipos inválidos |
| `deleteService(id)`             | El servicio eliminado, o `null` si no existe                                     |

```js
const todos = await serviceManager.getServices();
const disponibles = await serviceManager.getServices({ available: true });
const servicio = await serviceManager.getServiceById(1);

const creado = await serviceManager.addService({
    name: 'Consulta nutricional',
    description: 'Evaluacion y plan alimentario personalizado',
    duration: 40,
    price: 1000,
    category: 'salud',
    available: true
});

try {
    await serviceManager.addService({ name: 'Incompleto' });
} catch (error) {
    console.log(error.message); // Servicio incompleto. Faltan los campos: ...
}

const actualizado = await serviceManager.updateService(2, { price: 1300 });
const eliminado = await serviceManager.deleteService(3);
```

### `BookingManager`

| Método                                 | Devuelve                                                                    |
| -------------------------------------- | --------------------------------------------------------------------------- |
| `getBookings({ status })`              | Array de reservas; el filtro `status` es opcional                           |
| `createBooking(bookingData)`           | La reserva creada con su `id` y `services: []`; lanza `Error` si faltan campos |
| `getBookingById(id)`                   | La reserva, o `null` si no existe                                           |
| `addServiceToBooking(bookingId, serviceId)` | La reserva actualizada (suma `quantity` si el servicio ya estaba), o `null` si la reserva no existe |

```js
const todas = await bookingManager.getBookings();
const confirmadas = await bookingManager.getBookings({ status: 'confirmado' });

const reserva = await bookingManager.createBooking({
    clientName: 'Ana Perez',
    clientEmail: 'ana@mail.com',
    date: '2026-10-10',
    time: '10:00'
});

await bookingManager.addServiceToBooking(reserva.id, 2);
const buscada = await bookingManager.getBookingById(reserva.id);
```

> `BookingManager` no valida que el servicio exista: esa comprobación la hace el controller (`bookings.controller.js`) usando `ServiceManager` antes de llamar a `addServiceToBooking`.

## Arquitectura

Cada petición pasa por tres capas, cada una con una sola responsabilidad:

| Capa           | Responsabilidad                                                                           |
| -------------- | ----------------------------------------------------------------------------------------- |
| **Router**     | Define qué ruta y método atiende cada controller (y los middlewares previos, como validar el id) |
| **Controller** | Lee `req`, llama al manager, elige el código de estado y arma la respuesta                |
| **Manager**    | Lee y escribe el archivo JSON y aplica las validaciones de los datos                      |

## Estructura del proyecto

```
src/
  app.js                         -> arma la app Express (middlewares y rutas)
  server.js                      -> levanta el servidor
  routes/
    services.router.js           -> rutas de /api/services
    bookings.router.js           -> rutas de /api/bookings
  controllers/
    services.controller.js       -> atiende las peticiones de services
    bookings.controller.js       -> atiende las peticiones de bookings
  managers/
    ServiceManager.js            -> lógica de services.json
    BookingManager.js            -> lógica de bookings.json
  data/
    services.json                -> persistencia de servicios
    bookings.json                -> persistencia de reservas
  config/
    env.config.js                -> carga y valida las variables de entorno
package.json
.env.example
.gitignore
README.md
```
