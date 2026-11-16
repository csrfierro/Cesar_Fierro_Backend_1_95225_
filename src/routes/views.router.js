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

// ===== 4. UTILIDADES =====

/**
 * NOTA: Genera el array de números de página para mostrar en la paginación.
 * Lógica: muestra hasta 5 páginas como máximo, con ellipsis (...) si es necesario.
 */
function buildPageNumbers(meta) {
  const { page, totalPages } = meta;
  if (totalPages <= 1 || totalPages === undefined) return [];

  const pageNumbers = [];
  let start = Math.max(1, page - 2);
  let end = Math.min(totalPages, page + 2);

  // Agregar primera página siempre
  if (start > 1) {
    pageNumbers.push({ number: 1, isCurrent: false, isDots: false });
    if (start > 2) {
      pageNumbers.push({ number: null, isCurrent: false, isDots: true });
    }
  }

  for (let i = start; i <= end; i++) {
    pageNumbers.push({ number: i, isCurrent: i === page, isDots: false });
  }

  // Agregar última página siempre si no está incluida
  if (end < totalPages) {
    if (end < totalPages - 1) {
      pageNumbers.push({ number: null, isCurrent: false, isDots: true });
    }
    pageNumbers.push({ number: totalPages, isCurrent: false, isDots: false });
  }

  return pageNumbers;
}

// ===== 5. RUTAS DE VISTAS =====

// GET /views -> lista de servicios con Handlebars (con paginación)
router.get("/views", async (req, res) => {
  try {
    // NOTA: extraemos page y limit de los query params para paginación.
    const page = req.query.page ? parseInt(req.query.page, 10) : undefined;
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : undefined;

    // NOTA: obtenemos los servicios desde MongoDB con paginación.
    const result = await servicesService.getServices({ page, limit });

    // NOTA: generamos los números de página para la UI.
    const pageNumbers = buildPageNumbers(result.meta);

    // NOTA: res.render busca "views/services.handlebars" y lo inyecta en el layout "main".
    res.render("services", {
      title: "Lista de Servicios",
      services: result.data,
      meta: { ...result.meta, pageNumbers },
      queryParams: new URLSearchParams(req.query).toString(),
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

// GET /views/bookings -> lista de reservas con Handlebars (con paginación)
router.get("/views/bookings", async (req, res) => {
  try {
    // NOTA: extraemos page y limit de los query params para paginación.
    const page = req.query.page ? parseInt(req.query.page, 10) : undefined;
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : undefined;

    // NOTA: obtenemos las reservas desde MongoDB con paginación.
    const result = await bookingsService.getBookings({ page, limit });

    // NOTA: generamos los números de página para la UI.
    const pageNumbers = buildPageNumbers(result.meta);

    // NOTA: res.render busca "views/bookings.handlebars" y lo inyecta en el layout "main".
    res.render("bookings", {
      title: "Lista de Reservas",
      bookings: result.data,
      meta: { ...result.meta, pageNumbers },
      queryParams: new URLSearchParams(req.query).toString(),
    });
  } catch (error) {
    res.status(500).send("Error al cargar las reservas");
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