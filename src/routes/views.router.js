// ===== 1. IMPORTACIONES =====

// NOTA: Router es una "mini aplicación" de Express que agrupa rutas relacionadas (vistas HTML).
import { Router } from "express";

// NOTA: importamos los services para obtener datos reales de MongoDB y renderizarlos en las vistas.
import ServicesService from "../services/services.service.js";

// NOTA: importamos el bookings service para obtener reservas individuales.
import BookingsService from "../services/bookings.service.js";

// ===== 2. INSTANCIAS DE SERVICES =====
const servicesService = new ServicesService();
const bookingsService = new BookingsService();

// ===== 3. CREACIÓN DEL ROUTER =====
const router = Router();

// ===== 4. RUTAS DE VISTAS =====

// GET /views -> lista de servicios con Handlebars
router.get("/views", async (req, res) => {
  try {
    // NOTA: obtenemos todos los servicios desde MongoDB para pasarlos a la plantilla.
    const services = await servicesService.getServices({});
    // NOTA: res.render busca automáticamente "views/services.handlebars"
    // y lo inyecta en el layout "main" usando {{{body}}}.
    res.render("services", {
      title: "Lista de Servicios",
      services: services,
    });
  } catch (error) {
    res.status(500).send("Error al cargar los servicios");
  }
});

// GET /views/services/:sid -> detalle de un servicio con Handlebars
router.get("/views/services/:sid", async (req, res) => {
  try {
    // NOTA: obtenemos el servicio individual por su ID de MongoDB.
    const service = await servicesService.getServiceById(req.params.sid);
    if (!service) {
      return res.status(404).send("Servicio no encontrado");
    }
    // NOTA: res.render busca "views/service-detail.handlebars" y lo inserta en el layout "main".
    res.render("service-detail", {
      title: "Detalle del Servicio",
      service: service,
    });
  } catch (error) {
    res.status(500).send("Error al cargar el servicio");
  }
});

// GET /views/booking/:bid -> detalle de una reserva con Handlebars
router.get("/views/booking/:bid", async (req, res) => {
  try {
    // NOTA: obtenemos la reserva por su ID desde MongoDB.
    const booking = await bookingsService.getBookingById(req.params.bid);
    if (!booking) {
      return res.status(404).send("Reserva no encontrada");
    }
    // NOTA: res.render busca "views/booking-detail.handlebars" y lo inserta en el layout "main".
    res.render("booking-detail", {
      title: "Detalle de la Reserva",
      booking: booking,
    });
  } catch (error) {
    res.status(500).send("Error al cargar la reserva");
  }
});

// NOTA: export default para montar este router en app.js con un solo import.
export default router;
