// ===== 1. IMPORTACIONES =====
// Como package.json tiene "type": "module", usamos import/export (ESM)
import express from "express"; // librería para crear el servidor
import { config } from "./config/env.config.js"; // configuración ya validada (PORT, NODE_ENV)
import ServiceManager from "./managers/ServiceManager.js"; // clase que maneja los servicios

// ===== 2. CREACIÓN DE LA APP =====
const app = express(); // crea la aplicación del servidor
const serviceManager = new ServiceManager(); // crea UN manager que usaremos en las rutas
// NOTA: new ServiceManager() lleva paréntesis, así que se ejecuta ahora: UNA sola vez, al arrancar.
// Todas las rutas reutilizan este mismo manager.

// ===== 3. MIDDLEWARE =====
// Un middleware se ejecuta ANTES de las rutas, en cada petición.
// express.json() lee el body de las peticiones y lo convierte en objeto (req.body).
// Ahora lo usan POST y PUT para leer los datos que manda el cliente.
// NOTA: app.use(...) agrega una función a la "fila" por la que pasa CADA petición, de arriba
// hacia abajo. Por eso va ANTES de las rutas. express.json() lleva paréntesis: se ejecuta una
// vez al arrancar y devuelve la función (el middleware) que app.use registra.
// Un middleware propio recibe (req, res, next) y llama a next() para dejar seguir la petición.
app.use(express.json());

// ---------- 1. Medir cuánto tarda cada petición ----------
// Se registra con app.use, así corre en TODAS las peticiones.
// Va después de express.json() y antes de las rutas.
const medirTiempo = (req, res, next) => {
  const inicio = Date.now();

  // "finish" es un evento que se dispara cuando la respuesta ya se envió al cliente.
  // Recién ahí sabemos el código de estado y cuánto tardó.
  res.on("finish", () => {
    const ms = Date.now() - inicio;
    console.log(`${req.method} ${req.url} -> ${res.statusCode} (${ms} ms)`);
  });

  next(); // dejamos que la petición siga hacia la ruta
};

app.use(medirTiempo);
// En la terminal vas a ver, por ejemplo: GET /api/services -> 200 (3 ms)

// ---------- 2. Validar que el id de la URL sea un número ----------
// No se usa con app.use (correría en TODAS las rutas): se pone solo en las rutas que
// tienen :sid, como segundo argumento, entre la dirección y la función de la ruta.
const validarId = (req, res, next) => {
  const { sid } = req.params;

  // Number("abc") da NaN (Not a Number)
  if (Number.isNaN(Number(sid))) {
    // Respondemos con return y SIN llamar a next(): la petición se corta acá
    return res.status(400).json({
      status: "error",
      message: "El id debe ser un número",
    });
  }

  next(); // el id es válido, seguimos hacia la ruta
};
// Uso: se agrega antes de la función de las rutas GET, PUT y DELETE de "/api/services/:sid"


// ===== 4. RUTA RAÍZ =====
// app.get(ruta, función) -> "cuando llegue un GET a esta ruta, ejecutá esta función"
// req = lo que pide el cliente | res = lo que le respondemos
// NOTA: al arrancar el servidor la ruta solo se REGISTRA. La función de adentro se ejecuta
// recién cuando llega una petición GET a "/".
app.get("/", (req, res) => {
  res.status(200).json({
    // 200 = todo salió bien
    status: "correcto",
    message: "API del Sistema de Turnos y Reservas",
  });
});

// ===== 5. RUTA DE SERVICIOS =====
// La función es async porque getServices() lee un archivo y tarda un poco
// NOTA - Códigos de estado que se usan: 200 = ok | 201 = creado | 400 = datos incorrectos del
// cliente | 404 = no existe | 500 = error del servidor.
// NOTA - try/catch: hay un await sobre un archivo que puede fallar (no se puede leer, JSON roto).
// Si falla, el error cae en el catch y se responde 500, en vez de dejar la petición colgada.
app.get("/api/services", async (req, res) => {
  try {
    // NOTA: req.query trae los filtros de la URL (?category=salud&available=true).
    // Todo lo que llega por la URL es TEXTO ('true', no true); el manager lo convierte.
    // Las llaves de acá DESARMAN req.query y sacan esas dos propiedades.
    const { category, available } = req.query;
    // NOTA: en esta llamada las llaves ARMAN un objeto { category: category, available: available }
    // que el manager desarma en su parámetro. La ruta solo pasa los filtros; filtra el manager.
    // await espera a que el manager termine y entrega el valor (sin await sería una Promise).
    const services = await serviceManager.getServices({ category, available });

    res.status(200).json({
      status: "correcto",
      payload: services,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
});

// GET /api/services/:sid  ->  un servicio por id
app.get("/api/services/:sid", validarId, async (req, res) => {
  try {
    // NOTA: ":sid" es un hueco que se llena con lo que venga en la URL. Con /api/services/3,
    // req.params vale { sid: '3' }. El nombre tiene que coincidir con el de la ruta.
    const { sid } = req.params;
    const service = await serviceManager.getServiceById(sid);

    // El manager devuelve null si no existe
    // NOTA: el return corta la función acá. Sin return seguiría hasta el res de abajo y
    // respondería dos veces (error "Cannot set headers after they are sent").
    if (!service) {
      return res.status(404).json({
        status: "error",
        message: "Servicio no encontrado",
      });
    }

    res.status(200).json({
      status: "correcto",
      payload: service,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
});

// POST /api/services  ->  crea un servicio (el id lo genera el manager)
app.post("/api/services", async (req, res) => {
  try {
    // addService valida los campos obligatorios y lanza un Error si faltan
    // NOTA: req.body es el JSON que mandó el cliente (gracias a express.json()).
    // Si mandan un id, el manager también lo rechaza: el id siempre se genera solo.
    const newService = await serviceManager.addService(req.body);

    res.status(201).json({
      status: "correcto",
      payload: newService,
    });
  } catch (error) {
    // NOTA: cualquier error de addService sale como 400 (lo normal: faltan campos o mandaron
    // un id). Si fallara la lectura del archivo también saldría 400 en vez de 500.
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
});

// PUT /api/services/:sid  ->  actualiza un servicio (el id no se puede cambiar)
app.put("/api/services/:sid", validarId, async (req, res) => {
  try {
    const { sid } = req.params;
    // NOTA: si el PUT llega sin body, en Express 5 req.body es undefined; el manager lo cubre
    // con su "= {}". El manager devuelve null si el servicio no existe.
    const updatedService = await serviceManager.updateService(sid, req.body);

    if (!updatedService) {
      return res.status(404).json({
        status: "error",
        message: "Servicio no encontrado",
      });
    }

    res.status(200).json({
      status: "correcto",
      payload: updatedService,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
});

// DELETE /api/services/:sid  ->  elimina un servicio
app.delete("/api/services/:sid", validarId, async (req, res) => {
  try {
    const { sid } = req.params;
    // NOTA: deleteService NO se ejecuta al arrancar (ahí la ruta solo se registra). Se ejecuta
    // cuando llega un DELETE a esta dirección, en esta línea (los paréntesis la llaman).
    // Lo que el manager devuelve con return vuelve acá y se guarda en deletedService.
    const deletedService = await serviceManager.deleteService(sid);

    if (!deletedService) {
      return res.status(404).json({
        status: "error",
        message: "Servicio no encontrado",
      });
    }

    res.status(200).json({
      status: "correcto",
      payload: deletedService,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
});

// ===== RUTA NO ENCONTRADA (404) =====
// Va AL FINAL: después de todas las rutas y antes de app.listen.
// Solo llega acá si ninguna ruta de arriba respondió. Acá el orden es al revés
// que en los otros middlewares: tiene que ir último.
const rutaNoEncontrada = (req, res) => {
  res.status(404).json({
    status: "error",
    message: `Ruta no encontrada: ${req.method} ${req.url}`,
  });
};

app.use(rutaNoEncontrada);

// ===== 6. ARRANQUE DEL SERVIDOR =====
// listen(puerto, callback) deja el servidor esperando peticiones.
// El callback se ejecuta una sola vez, cuando el servidor ya arrancó.
// NOTA: config.port sale del .env pasando por env.config.js. La función flecha va SIN
// paréntesis de ejecución: Express la llama solo, cuando el servidor termina de arrancar.
app.listen(config.port, () => {
  console.log(
    `Servidor escuchando en http://localhost:${config.port} (${config.nodeEnv})`,
  );
});