import { Router } from "express";
import { validarIds } from "../middlewares/validarIds.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import { getBookings, createBooking, getBookingById, addServiceToBooking, updateStatus, deleteBooking } from "../controllers/bookings.controller.js";
import { bookingCreateSchema } from "../validators/booking.validator.js";

const router = Router();

// NOTA: el router solo dice qué controller atiende cada ruta (prefijo: /api/bookings)

// GET /api/bookings -> lista de reservas con filtro (?status=)
router.get("/", getBookings);

// POST /api/bookings -> crear una reserva (validado con Zod)
router.post("/", validateRequest(bookingCreateSchema), createBooking);

// IMPORTANTE: esta ruta debe ir ANTES de /:bid para que coincida correctamente
router.patch("/:bid/status", validarIds, updateStatus);

// GET /api/bookings/:bid -> obtiene una reserva con servicios detallados (populate)
router.get("/:bid", validarIds, getBookingById);

// POST /api/bookings/:bid/services/:sid -> agrega un servicio a una reserva
router.post("/:bid/services/:sid", validarIds, addServiceToBooking);

// DELETE /api/bookings/:bid -> elimina una reserva
router.delete("/:bid", validarIds, deleteBooking);

export default router;
