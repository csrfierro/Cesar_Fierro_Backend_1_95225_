import { Router } from "express";
import { validarIds } from "../middlewares/validarIds.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import { getServices, getServiceById, createService, updateService, deleteService } from "../controllers/services.controller.js";
import { serviceCreateSchema, serviceUpdateSchema } from "../validators/service.validator.js";

const router = Router();

// GET /api/services -> lista de servicios con filtros y paginación (?category=, ?available=, ?page=, ?limit=, ?sortBy=, ?order=)
router.get("/", getServices);

// POST /api/services -> crear un servicio (validado con Zod)
router.post("/", validateRequest(serviceCreateSchema), createService);

// GET /api/services/:sid -> obtener un servicio por ID
router.get("/:sid", validarIds, getServiceById);

// PUT /api/services/:sid -> actualizar un servicio (validado con Zod)
router.put("/:sid", validarIds, validateRequest(serviceUpdateSchema), updateService);

// DELETE /api/services/:sid -> eliminar un servicio
router.delete("/:sid", validarIds, deleteService);

export default router;
