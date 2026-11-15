import { Router } from "express";
import {
  getBookings,
  createBooking,
  getBookingById,
  addServiceToBooking,
  updateStatus,
  deleteBooking,
} from "../controllers/bookings.controller.js";
import { validarIds } from "../middlewares/validarIds.js";

const router = Router();

// NOTA: el router solo dice qué controller atiende cada ruta (prefijo: /api/bookings)
router.get("/", getBookings);
router.post("/", createBooking);

// IMPORTANTE: esta ruta debe ir ANTES de /:bid para que coincida correctamente
router.patch("/:bid/status", validarIds, updateStatus);

router.get("/:bid", validarIds, getBookingById);
router.post("/:bid/services/:sid", validarIds, addServiceToBooking);
router.delete("/:bid", validarIds, deleteBooking);

export default router;
