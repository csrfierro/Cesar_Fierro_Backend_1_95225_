// ===== 1. IMPORTACIONES =====
// Router es una "mini aplicación" de Express: agrupa rutas relacionadas (todas las de
// "services") en un archivo aparte, en vez de tenerlas todas sueltas en app.js.
import { Router } from "express";
// NOTA: con llaves porque son export con nombre; los nombres deben coincidir exactamente
// con los que se exportan en services.controller.js.
import {
  getServices,
  getServiceById,
  addService,
  updateService,
  deleteService,
} from "../controllers/services.controller.js";

// ===== 2. CREACIÓN DEL ROUTER =====
// NOTA: Router() se ejecuta una sola vez, al cargar este archivo, y devuelve un objeto
// router al que después le vamos agregando rutas (router.get, router.post, etc.).
const router = Router();

// ---------- Validar que el id de la URL sea un número ----------
// Middleware propio: se ejecuta ANTES que el controller, solo en las rutas que tienen
// ":sid" (GET, PUT, DELETE por id). Recibe (req, res, next) igual que cualquier
// middleware; si el id es válido llama a next() y deja pasar la petición hacia el controller.
// No se usa con app.use porque se aplicaría a todas las peticiones y solo lo necesitan
// las rutas con ":sid".
const validarId = (req, res, next) => {
  // req.params trae los valores de la URL marcados con ":". Con GET /api/services/3,
  // req.params vale { sid: '3' } (siempre como texto).
  const { sid } = req.params;
  // Number("abc") da NaN. Number.isNaN() chequea eso específicamente
  // (isNaN() a secas tiene casos raros, por eso se usa la versión de Number).
  if (Number.isNaN(Number(sid))) {
    // return corta la función acá mismo: no se llama a next(), así que la petición
    // nunca llega al controller y el cliente recibe este 400 (bad request).
    return res.status(400).json({
      status: "error",
      message: "El id debe ser un número",
    });
  }

  next(); // el id es válido, dejamos que la petición siga hacia el controller
};

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
router.post("/", addService);
router.put("/:sid", validarId, updateService);
router.delete("/:sid", validarId, deleteService);

// NOTA: export default (y no "export { router }") porque app.js necesita UN solo router
// para montar; con default se puede importar con cualquier nombre.
export default router;
