import BookingsRepository from "../repositories/bookings.repository.js";
import ServicesRepository from "../repositories/services.repository.js";
import { ValidationError, NotFoundError } from "../utils/errors.js";

// Campos obligatorios al crear una reserva (el id se genera solo y services arranca vacio)
const REQUIRED_FIELDS = ["clientName", "clientEmail", "date", "time"];

export default class BookingsService {
  // NOTA: necesita DOS repositories: el de reservas y el de servicios, porque al agregar
  // un servicio a una reserva hay que comprobar que ese servicio exista.
  constructor(
    bookingsRepository = new BookingsRepository(),
    servicesRepository = new ServicesRepository(),
  ) {
    this.bookingsRepository = bookingsRepository;
    this.servicesRepository = servicesRepository;
  }

  async getBookings({ status } = {}) {
    let bookings = await this.bookingsRepository.getAll();
    if (status) {
      bookings = bookings.filter((booking) => booking.status === status);
    }
    return bookings;
  }

  async createBooking(bookingData = {}) {
    const missingFields = REQUIRED_FIELDS.filter(
      (field) =>
        bookingData[field] === undefined ||
        bookingData[field] === null ||
        bookingData[field] === "",
    );
    if (missingFields.length > 0) {
      throw new ValidationError(
        `Reserva incompleta. Faltan los campos: ${missingFields.join(", ")}`,
      );
    }

    if ("id" in bookingData) {
      throw new ValidationError("El id se genera automaticamente y no se puede enviar");
    }

    return this.bookingsRepository.create({
      clientName: bookingData.clientName,
      clientEmail: bookingData.clientEmail,
      date: bookingData.date,
      time: bookingData.time,
      status: bookingData.status ?? "pendiente",
      services: [],
    });
  }


  async getBookingById(id) {
    const booking = await this.bookingsRepository.getById(id);
    if (!booking) throw new NotFoundError("Reserva no encontrada");
    return booking;
  }

  // REGLA DE NEGOCIO CLAVE: si el servicio ya estaba en la reserva se suma 1 a quantity;
  // si no, se agrega con quantity 1. Esta logica vive ACA (no en el DAO).
  async addServiceToBooking(bookingId, serviceId) {
    // Se validan los dos recursos antes de escribir nada
    const booking = await this.getBookingById(bookingId);

    const service = await this.servicesRepository.getById(serviceId);
    if (!service) throw new NotFoundError("Servicio no encontrado");

    // Se trabaja sobre una copia para no mutar el objeto que devolvio el repository
    const services = booking.services.map((item) => ({ ...item }));
    const item = services.find((s) => s.service === service.id);

    if (item) {
      item.quantity += 1;
    } else {
      services.push({ service: service.id, quantity: 1 });
    }

    return this.bookingsRepository.update(bookingId, { services });
  }
}
