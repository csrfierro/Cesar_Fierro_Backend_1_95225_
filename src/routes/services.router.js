// ===== 1. IMPORTACIONES =====
// Router es una "mini aplicación" de Express: agrupa rutas relacionadas (todas las de
// "services") en un archivo aparte, en vez de tenerlas todas sueltas en app.js.
import { Router } from "express";
// NOTA: con llaves porque son export con nombre; los nombres deben coincidir exactamente
// con los que se exportan en services.controller.js.
import {
  getServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
} from "../controllers/services.controller.js";
// NOTA: validarId vive en middlewares/: el router solo lo engancha a las rutas con ":sid".
import { validarId } from "../middlewares/validarId.js";

// ===== 2. CREACIÓN DEL ROUTER =====
// NOTA: Router() se ejecuta una sola vez, al cargar este archivo, y devuelve un objeto
// router al que después le vamos agregando rutas (router.get, router.post, etc.).
const router = Router();

// ===== 3. RUTAS =====
// NOTA IMPORTANTE: como este router se monta en app.js con
// app.use("/api/services", servicesRouter), Express ya le puso el prefijo "/api/services"
// antes de que la petición llegue acá. Por eso las rutas se escriben como "/" y "/:sid",
// SIN repetir "/api/services".
// NOTA: el controller se pasa SIN paréntesis (getServices, no getServices()): Express lo
// ejecuta cuando llega la petición. El orden de los argumentos es el orden de ejecución:
// primero validarId (si está), después el controller.
router.get("/", getServices);
router.get("/:sid", validarId, getServiceById);
router.post("/", createService);
router.put("/:sid", validarId, updateService);
router.delete("/:sid", validarId, deleteService);

// NOTA: export default (y no "export { router }") porque app.js necesita UN solo router
// para montar; con default se puede importar con cualquier nombre.
export default router;
