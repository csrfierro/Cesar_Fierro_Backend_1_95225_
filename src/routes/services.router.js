// ===== 1. IMPORTACIONES =====
// Router es una "mini aplicación" de Express: agrupa rutas relacionadas (todas las de
// "services") en un archivo aparte, en vez de tenerlas todas sueltas en app.js.
import { Router } from "express";
import ServiceManager, { ValidationError } from "../managers/ServiceManager.js";

// ===== 2. CREACIÓN DEL ROUTER =====
// NOTA: Router() se ejecuta una sola vez, al cargar este archivo, y devuelve un objeto
// router al que después le vamos agregando rutas (router.get, router.post, etc.), igual
// que hacíamos antes con "app.get", "app.post" directamente sobre app.js.
// El router tiene su propia instancia de ServiceManager (antes vivía en app.js). 
const router = Router();

//Como acá
// no le pasamos ninguna ruta a "new ServiceManager()", usa el archivo real (services.json).
// const serviceManager = new ServiceManager(process.env.SERVICES_FILE_PATH);
//El constructor es parte de la clase, es el método especial que corre automáticamente cuando escribís new
// new ServiceManager()
//         │
//         ├─ 1. crea objeto vacío: {}
//         ├─ 2. corre el constructor con ese objeto como "this"
//         │        this.path = DEFAULT_PATH
//         │        → el objeto pasa a ser: { path: ".../services.json" }
//         └─ 3. devuelve ese objeto

// const serviceManager = ese objeto devuelto

// a partir de esta línea, cada vez que en tus rutas hacés 
// serviceManager.getServiceById(sid), 
// ese método ya sabe, sin que se lo digas, que tiene que leer services.json — 
// porque tiene guardado this.path desde el momento en que se creó.


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

// ---------- Validar que el id de la URL sea un número ----------
// Middleware propio: se ejecuta ANTES que la función de la ruta, solo en las rutas que
// tienen ":sid" (GET, PUT, DELETE por id). Recibe (req, res, next) igual que cualquier
// middleware; si el id es válido llama a next() y deja pasar la petición hacia la ruta.
const validarId = (req, res, next) => {
  // req.params trae los valores que vienen en la URL, en los lugares marcados con ":".
  // Con GET /api/services/3, req.params vale { sid: '3' } (siempre como texto).
  const { sid } = req.params;
  // Number("abc") da NaN (Not a Number). Number.isNaN() chequea eso específicamente
  // (isNaN() a secas tiene casos raros, por eso se usa la versión de Number).
  if (Number.isNaN(Number(sid))) {
    // return corta la función acá mismo: no se llama a next(), así que la petición
    // nunca llega a la ruta y el cliente recibe este 400 (bad request).
    return res.status(400).json({
      status: "error",
      message: "El id debe ser un número",
    });
  }

  next(); // el id es válido, dejamos que la petición siga hacia la ruta
};

// ===== 3. RUTAS =====
// NOTA IMPORTANTE sobre las rutas: como este router se monta en app.js con
// app.use("/api/services", servicesRouter), Express ya le puso el prefijo "/api/services"
// antes de que la petición llegue acá. Por eso adentro del router las rutas se escriben
// como "/" (que en la práctica es "/api/services") y "/:sid" (que es "/api/services/:sid"),
// SIN repetir "/api/services" en cada una.

// GET /api/services  ->  todos los servicios (con filtros opcionales por query params)
// La función es async porque getServices() lee un archivo y tarda un poco (usa await adentro).
router.get("/", async (req, res) => {
  try {
    // req.query trae los filtros que vienen después del "?" en la URL
    // (?category=salud&available=true). 
    // Todo lo que llega por acá es TEXTO ('true', no true); es el manager el que se encarga de convertirlo cuando hace falta.
    // Estas llaves DESARMAN req.query y sacan esas dos propiedades puntuales y crea variables. con ese mismo nombre
//     const { category, available } = req.query;
//               ↑ qué sacar              ↑ de dónde
    const { category, available } = req.query;
    // Acá las llaves ARMAN un objeto { category: category, available: available } que el
    // manager desarma en su propio parámetro. La ruta solo junta y pasa los filtros;
    // quien filtra de verdad es el manager (getServices en ServiceManager.js).
    // await espera a que el manager termine y entrega el valor ya resuelto (sin await
    // acá tendríamos una Promise sin resolver, no el array de servicios).
    const services = await serviceManager.getServices({ category, available });

    // 200 = la petición se pudo resolver sin problemas (haya o no resultados).
    res.status(200).json({
      status: "correcto",
      payload: services,
    });
  } catch (error) {
    // Si algo falla leyendo el archivo (o cualquier error inesperado), respondemos 500
    // (error del servidor) en vez de dejar la petición colgada sin respuesta.
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
});

// GET /api/services/:sid  ->  un servicio por id
// validarId corre primero (segundo argumento, antes de la función de la ruta) y corta acá
// validarId no se usa con app.use porque se aplicaria a todos los req y no necesitamos eso, solo los que tienen ":sid".
// si el sid no es un número; si es válido, deja pasar con next() y se sigue para abajo.
router.get("/:sid", validarId, async (req, res) => {
  try {
    //console.log(req);
    const sid = req.params.sid;
    const service = await serviceManager.getServiceById(sid);

    // El manager devuelve null cuando no encuentra el id.
    // El return corta la función acá: sin él seguiría hasta el res.status(200) de abajo y
    // respondería dos veces, lo que tira el error "Cannot set headers after they are sent".
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
router.post("/", async (req, res) => {
  try {
    // req.body es el JSON que mandó el cliente en el cuerpo de la petición. Solo llega
    // parseado (como objeto) gracias al middleware express.json() que se registró en
    // app.js con app.use(express.json()) ANTES de montar este router.
    // addService valida que estén todos los campos obligatorios y lanza un Error si falta
    // alguno; si el body trae un "id", también lo rechaza (el id siempre se genera solo).
    const newService = await serviceManager.addService(req.body);

    // 201 = se creó un recurso nuevo (a diferencia del 200, que es "todo bien" sin más).
    res.status(201).json({
      status: "correcto",
      payload: newService,
    });
  } catch (error) {
    // addService lanza ValidationError (campos faltantes, tipos invalidos, id enviado a
    // mano): son errores del CLIENTE y van con 400. Cualquier otro error va con 500.
    responderError(res, error);
  }
});

// PUT /api/services/:sid  ->  actualiza un servicio (el id no se puede cambiar)
router.put("/:sid", validarId, async (req, res) => {
  try {
    const { sid } = req.params;
    // Si el PUT llega sin body, en Express 5 req.body queda undefined; el manager lo
    // cubre solo con su propio valor por defecto ("= {}") en updateService.
    // El manager devuelve null si el servicio no existe (mismo patrón que getServiceById).
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
});

// DELETE /api/services/:sid  ->  elimina un servicio
router.delete("/:sid", validarId, async (req, res) => {
  try {
    const { sid } = req.params;
    // deleteService borra el servicio del archivo y devuelve el objeto eliminado (o null
    // si no existía). Lo que el manager devuelve con su "return" vuelve acá y queda
    // guardado en esta constante.
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

// NOTA: export default (y no "export { router }") porque app.js necesita UN solo router
// para montar; con default se puede importar con cualquier nombre:
// import servicesRouter from "./routes/services.router.js"
export default router;