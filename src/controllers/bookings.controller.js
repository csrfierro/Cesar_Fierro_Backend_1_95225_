import BookingManager from "../managers/BookingManager.js";
import ServiceManager from "../managers/ServiceManager.js";

// NOTA: cada manager lee su propio archivo (bookings.json / services.json). Este controller
// necesita los dos porque, al agregar un servicio a una reserva, hay que comprobar que el
// servicio exista.
const bookingManager = new BookingManager();
const serviceManager = new ServiceManager();

// GET /api/bookings -> todas las reservas (filtro opcional ?status=)
export const getBookings = async (req, res) => {
  try {
    const { status } = req.query;
    const bookings = await bookingManager.getBookings({ status });
    // 200 = la petición se pudo resolver sin problemas (haya o no resultados).
    res.status(200).json({
      status: "correcto",
      payload: bookings,
    });
  } catch (error) {
    // Si algo falla leyendo el archivo (o cualquier error inesperado), respondemos 500
    // (error del servidor) en vez de dejar la petición colgada sin respuesta.
    res.status(500).json({ status: "error", message: error.message });
  }
};

// POST /api/bookings -> crea una reserva (services arranca vacio)
export const createBooking = async (req, res) => {
  try {
    const newBooking = await bookingManager.createBooking(req.body);
    res.status(201).json({ status: "correcto", payload: newBooking });
  } catch (error) {
    // createBooking lanza Error si faltan campos o si mandan un id: error del CLIENTE (400)
    res.status(400).json({ status: "error", message: error.message });
  }
};

// GET /api/bookings/:bid -> una reserva por id
export const getBookingById = async (req, res) => {
  try {
    const booking = await bookingManager.getBookingById(req.params.bid);

    if (!booking) {
      return res
        .status(404)
        .json({ status: "error", message: "Reserva no encontrada" });
    }

    res.status(200).json({ status: "correcto", payload: booking });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

// POST /api/bookings/:bid/services/:sid -> agrega un servicio a una reserva
export const addServiceToBooking = async (req, res) => {
  try {
    const { bid, sid } = req.params;

    // Se validan los dos recursos antes de escribir nada
    const booking = await bookingManager.getBookingById(bid);
    if (!booking) {
      return res
        .status(404)
        .json({ status: "error", message: "Reserva no encontrada" });
    }

    const service = await serviceManager.getServiceById(sid);
    if (!service) {
      return res
        .status(404)
        .json({ status: "error", message: "Servicio no encontrado" });
    }

    const updatedBooking = await bookingManager.addServiceToBooking(bid, sid);
    res.status(200).json({ status: "correcto", payload: updatedBooking });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};
