import { Router } from "express";
import {
  getBookings,
  createBooking,
  getBookingById,
  addServiceToBooking,
} from "../controllers/bookings.controller.js";
import { validarIds } from "../middlewares/validarIds.js";

const router = Router();

// NOTA: el router solo dice qué controller atiende cada ruta (prefijo: /api/bookings)
router.get("/", getBookings);
router.post("/", createBooking);
router.get("/:bid", validarIds, getBookingById);
router.post("/:bid/services/:sid", validarIds, addServiceToBooking);

export default router;
