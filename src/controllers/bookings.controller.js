import BookingsService from "../services/bookings.service.js";
import { responderError } from "../utils/responderError.js";

const bookingsService = new BookingsService();

// GET /api/bookings -> todas las reservas (filtro opcional ?status=)
export const getBookings = async (req, res) => {
  try {
    const { status } = req.query;
    const bookings = await bookingsService.getBookings({ status });
    res.status(200).json({ status: "correcto", payload: bookings });
  } catch (error) {
    responderError(res, error);
  }
};

// POST /api/bookings -> crea una reserva (services arranca vacio)
export const createBooking = async (req, res) => {
  try {
    const newBooking = await bookingsService.createBooking(req.body);
    res.status(201).json({ status: "correcto", payload: newBooking });
  } catch (error) {
    responderError(res, error);
  }
};

// GET /api/bookings/:bid -> una reserva por id
export const getBookingById = async (req, res) => {
  try {
    const booking = await bookingsService.getBookingById(req.params.bid);
    res.status(200).json({ status: "correcto", payload: booking });
  } catch (error) {
    responderError(res, error);
  }
};

// POST /api/bookings/:bid/services/:sid -> agrega un servicio a una reserva
export const addServiceToBooking = async (req, res) => {
  try {
    const { bid, sid } = req.params;
    const updatedBooking = await bookingsService.addServiceToBooking(bid, sid);
    res.status(200).json({ status: "correcto", payload: updatedBooking });
  } catch (error) {
    responderError(res, error);
  }
};
