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

  // CAMBIO: el filtro por status ahora lo resuelve MongoDB, ya no se filtra en memoria
  async getBookings({ status } = {}) {
    const filter = status ? { status } : {};
    return this.bookingsRepository.getAll(filter);
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

    // CAMBIO: en Mongo el identificador se llama _id, asi que tambien se rechaza
    if ("id" in bookingData || "_id" in bookingData) {
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

    // CAMBIO: los ids de Mongo son ObjectId (objetos) y === compara referencias, no valores.
    // Por eso se pasan a texto con String() antes de comparar.
    const item = services.find((s) => String(s.service) === String(service._id));

    if (item) {
      item.quantity += 1;
    } else {
      // CAMBIO: service._id en lugar de service.id
      services.push({ service: service._id, quantity: 1 });
    }

    return this.bookingsRepository.update(bookingId, { services });
  }
}
