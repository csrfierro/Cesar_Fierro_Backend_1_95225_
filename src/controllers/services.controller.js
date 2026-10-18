// ===== 1. IMPORTACIONES =====
// NOTA: un controller es la función que ATIENDE una ruta: lee la petición (req), le pide
// los datos al manager, elige el código de estado y arma la respuesta (res).
// El router solo decide qué función atiende cada ruta; el manager solo lee/escribe el JSON.
import ServiceManager, { ValidationError } from "../managers/ServiceManager.js";

// ===== 2. INSTANCIA DEL MANAGER =====
// NOTA: new ServiceManager() se ejecuta una sola vez, al cargar este archivo. Como no le
// pasamos ninguna ruta, el constructor usa DEFAULT_PATH (services.json) y la guarda en
// this.path; a partir de ahí, cada método del manager sabe qué archivo leer sin que se lo
// digamos en cada llamada.
const serviceManager = new ServiceManager();

// ---------- Responder segun el tipo de error ----------
// ValidationError = el cliente mando datos invalidos -> 400.
// Cualquier otro error (por ejemplo falla al leer/escribir el archivo) -> 500.
const responderError = (res, error) => {
  const statusCode = error instanceof ValidationError ? 400 : 500;
  res.status(statusCode).json({
    status: "error",
    message: error.message,
  });
};

// ===== 3. CONTROLLERS =====
// NOTA: son export con NOMBRE (no default) porque este archivo exporta varias funciones.
// Todas son async porque el manager lee/escribe archivos (usan await adentro).

// GET /api/services  ->  todos los servicios (con filtros opcionales por query params)
export const getServices = async (req, res) => {
  try {
    // req.query trae los filtros que vienen después del "?" en la URL
    // (?category=salud&available=true). Todo llega como TEXTO ('true', no true);
    // el manager se encarga de validarlo y convertirlo.
    // Las llaves DESARMAN req.query y crean variables con esos nombres.
    const { category, available } = req.query;
    // Acá las llaves ARMAN un objeto { category, available } que el manager desarma en su
    // propio parámetro. Quien filtra de verdad es el manager (getServices).
    // await entrega el valor ya resuelto (sin await tendríamos una Promise, no el array).
    const services = await serviceManager.getServices({ category, available });

    // 200 = la petición se pudo resolver sin problemas (haya o no resultados).
    res.status(200).json({
      status: "correcto",
      payload: services,
    });
  } catch (error) {
    // ValidationError (ej: ?available=manzana) -> 400; cualquier otro error -> 500
    responderError(res, error);
  }
};

// GET /api/services/:sid  ->  un servicio por id
// (el router corre validarId antes, así que sid ya es un número válido)
export const getServiceById = async (req, res) => {
  try {
    // req.params trae lo que va en los ":" de la URL (siempre como texto)
    const { sid } = req.params;
    const service = await serviceManager.getServiceById(sid);

    // El manager devuelve null cuando no encuentra el id.
    // El return corta la función acá: sin él seguiría hasta el res.status(200) de abajo y
    // respondería dos veces, lo que tira el error "Cannot set headers after they are sent".
    // Este 404 es una respuesta normal, no un error: no pasa por el catch.
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
    responderError(res, error);
  }
};

// POST /api/services  ->  crea un servicio (el id lo genera el manager)
export const addService = async (req, res) => {
  try {
    // req.body es el JSON que mandó el cliente. Llega parseado (como objeto) gracias al
    // middleware express.json() registrado en app.js ANTES de montar los routers.
    // addService valida campos obligatorios y tipos, y rechaza si el body trae un "id".
    const newService = await serviceManager.addService(req.body);

    // 201 = se creó un recurso nuevo (a diferencia del 200, que es "todo bien" sin más).
    res.status(201).json({
      status: "correcto",
      payload: newService,
    });
  } catch (error) {
    // ValidationError (campos faltantes, tipos invalidos, id enviado) -> 400; otro -> 500
    responderError(res, error);
  }
};

// PUT /api/services/:sid  ->  actualiza un servicio (el id no se puede cambiar)
export const updateService = async (req, res) => {
  try {
    const { sid } = req.params;
    // Si el PUT llega sin body, en Express 5 req.body queda undefined; el manager lo
    // cubre con su valor por defecto ("= {}"). Devuelve null si el servicio no existe.
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
    // updateService lanza ValidationError si algun campo tiene un tipo invalido (400)
    responderError(res, error);
  }
};

// DELETE /api/services/:sid  ->  elimina un servicio
export const deleteService = async (req, res) => {
  try {
    const { sid } = req.params;
    // deleteService borra el servicio del archivo y devuelve el objeto eliminado (o null
    // si no existía).
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
    responderError(res, error);
  }
};
