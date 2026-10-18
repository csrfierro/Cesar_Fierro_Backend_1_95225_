import { Router } from "express";
import {
  getBookings,
  createBooking,
  getBookingById,
  addServiceToBooking,
} from "../controllers/bookings.controller.js";

const router = Router();

// Valida que bid y/o sid (los que existan en la URL) sean numeros
const validarIds = (req, res, next) => {
  for (const [param, value] of Object.entries(req.params)) {
    if (Number.isNaN(Number(value))) {
      return res.status(400).json({
        status: "error",
        message: `El parametro ${param} debe ser un número`,
      });
    }
  }
  next();
};

// NOTA: el router solo dice qué controller atiende cada ruta (prefijo: /api/bookings)
router.get("/", getBookings);
router.post("/", createBooking);
router.get("/:bid", validarIds, getBookingById);
router.post("/:bid/services/:sid", validarIds, addServiceToBooking);

export default router;
