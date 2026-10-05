# Sistema de Turnos y Reservas - API de servicios y reservas

API REST con Node.js (ESM), Express y FileSystem para gestionar los **servicios** disponibles de un sistema de turnos y las **reservas** que hacen los clientes. Los datos se persisten en archivos JSON dentro de `src/data/`, por lo que no se pierden al reiniciar el servidor. El proyecto sigue una **arquitectura en capas** (router → controller → service → repository → DAO).

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

## Arquitectura en capas

Cada petición atraviesa las capas en este orden, y cada capa solo habla con la siguiente:

```
router → controller → service → repository → DAO → archivo JSON
```

| Capa           | Responsabilidad                                                                                  | Qué NO hace                              |
| -------------- | ------------------------------------------------------------------------------------------------ | ---------------------------------------- |
| **Router**     | Define los endpoints y los conecta al controller (y a los middlewares de `src/middlewares/`, como validar el id) | Lógica de cualquier tipo                 |
| **Controller** | Lee `req`, llama al service y responde con `res` (traduce errores a códigos HTTP)                | Reglas de negocio ni acceso a archivos   |
| **Service**    | Reglas de negocio: validaciones, filtros, existencia de recursos, suma de `quantity`             | Usar `req`/`res` ni tocar el JSON        |
| **Repository** | Métodos de acceso a datos (`getAll`, `getById`, `create`, `update`, `delete`) que esconden cómo se guarda | Reglas de negocio                |
| **DAO**        | Lee y escribe directamente el archivo JSON                                                       | Reglas de negocio                        |

**¿Por qué separar repository y DAO?** El service solo conoce al repository. Cuando la persistencia migre de archivos JSON a MongoDB (Mongoose), alcanza con reemplazar el DAO; controllers, services y repositories no cambian.

### Funciones por capa

| Recurso    | Controller y Service                                                                 | Repository y DAO                          |
| ---------- | ------------------------------------------------------------------------------------ | ----------------------------------------- |
| `services` | `getServices`, `getServiceById`, `createService`, `updateService`, `deleteService`   | `getAll`, `getById`, `create`, `update`, `delete` |
| `bookings` | `getBookings`, `createBooking`, `getBookingById`, `addServiceToBooking`              | `getAll`, `create`, `getById`, `update`   |

> `getBookings` / `getAll` de bookings se mantienen para conservar el `GET /api/bookings?status=` que ya existía.

### Regla de negocio clave

Si el mismo servicio se agrega dos veces a una reserva, se incrementa su `quantity` en lugar de duplicarlo. Esa lógica está en `bookings.service.js` (`addServiceToBooking`): el service lee la reserva, comprueba que reserva y servicio existan, calcula el nuevo array `services` y se lo pasa a `repository.update`. El DAO solo guarda lo que recibe.

### Manejo de errores

Los services no conocen HTTP: lanzan errores propios (`src/utils/errors.js`) y el controller los traduce con `responderError`:

| Error             | Código |
| ----------------- | ------ |
| `ValidationError` | `400`  |
| `NotFoundError`   | `404`  |
| Cualquier otro    | `500`  |

## Estructura del proyecto

```
src/
  app.js                         -> arma la app Express (middlewares y rutas)
  server.js                      -> levanta el servidor
  routes/
    services.router.js           -> rutas de /api/services
    bookings.router.js           -> rutas de /api/bookings
  controllers/
    services.controller.js       -> lee req, llama al service, responde con res
    bookings.controller.js
  services/
    services.service.js          -> reglas de negocio de services
    bookings.service.js          -> reglas de negocio de bookings (suma de quantity)
  repositories/
    services.repository.js       -> acceso a datos de services
    bookings.repository.js       -> acceso a datos de bookings
  dao/
    services.dao.js              -> lee/escribe services.json
    bookings.dao.js              -> lee/escribe bookings.json
  data/
    services.json                -> persistencia de servicios
    bookings.json                -> persistencia de reservas
  middlewares/
    validarId.js                 -> valida que :sid sea numerico (services)
    validarIds.js                -> valida que :bid y :sid sean numericos (bookings)
  utils/
    errors.js                    -> ValidationError y NotFoundError
    responderError.js            -> traduce errores del service a códigos HTTP
  config/
    env.config.js                -> carga y valida las variables de entorno
package.json
.env.example
.gitignore
README.md
```
