import BookingsRepository from "../repositories/bookings.repository.js";
import ServicesRepository from "../repositories/services.repository.js";
import { ValidationError, NotFoundError } from "../utils/errors.js";
import { getIO } from "../socket/index.js";

// Campos obligatorios al crear una reserva (el id se genera solo y services arranca vacio)
const REQUIRED_FIELDS = ["clientName", "clientEmail", "date", "time"];

export default class BookingsService {
  constructor(
    bookingsRepository = new BookingsRepository(),
    servicesRepository = new ServicesRepository(),
  ) {
    this.bookingsRepository = bookingsRepository;
    this.servicesRepository = servicesRepository;
  }

  async emitBookingCreated(booking) {
    try {
      const io = getIO();
      io.emit("booking-created", {
        _id: booking._id,
        clientName: booking.clientName,
        clientEmail: booking.clientEmail,
        date: booking.date,
        time: booking.time,
        status: booking.status || "pendiente",
        createdAt: booking.createdAt,
      });
    } catch (err) {
      console.error("[BookingsService] Error emitiendo evento 'booking-created':", err.message);
    }
  }

  async emitBookingUpdated(bookingId, oldStatus, newStatus) {
    try {
      const io = getIO();
      const booking = await this.getBookingById(bookingId);
      io.emit("booking-updated", {
        _id: booking._id,
        clientName: booking.clientName,
        clientEmail: booking.clientEmail,
        date: booking.date,
        time: booking.time,
        status: newStatus,
        oldStatus,
        newStatus,
        updatedAt: Date.now(),
      });
    } catch (err) {
      console.error("[BookingsService] Error emitiendo evento 'booking-updated':", err.message);
    }
  }

  async emitBookingDeleted(bookingId, clientName) {
    try {
      const io = getIO();
      const booking = await this.getBookingById(bookingId);
      io.emit("booking-deleted", {
        bookingId,
        clientName: booking.clientName,
        oldStatus: booking.status || "pendiente",
      });
    } catch (err) {
      console.error("[BookingsService] Error emitiendo evento 'booking-deleted':", err.message);
    }
  }

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

    if ("id" in bookingData || "_id" in bookingData) {
      throw new ValidationError("El id se genera automaticamente y no se puede enviar");
    }

    const created = await this.bookingsRepository.create({
      clientName: bookingData.clientName,
      clientEmail: bookingData.clientEmail,
      date: bookingData.date,
      time: bookingData.time,
      status: bookingData.status ?? "pendiente",
      services: [],
    });

    // Emitir evento de Socket.io para nueva reserva
    await this.emitBookingCreated(created);

    return created;
  }

  async getBookingById(id) {
    const booking = await this.bookingsRepository.getById(id);
    if (!booking) throw new NotFoundError("Reserva no encontrada");
    return booking;
  }

  async updateStatus(bookingId, newStatus) {
    // Validar que exista la reserva antes de actualizar
    const booking = await this.getBookingById(bookingId);

    // Validar estado válido
    const validStatuses = ["pendiente", "confirmada", "cancelada"];
    if (!validStatuses.includes(newStatus)) {
      throw new ValidationError(`Estado inválido: ${newStatus}. Valores permitidos: ${validStatuses.join(", ")}`);
    }

    // Si ya está en ese estado, no hacer nada
    if (booking.status === newStatus) {
      return booking;
    }

    const oldStatus = booking.status;

    const updated = await this.bookingsRepository.update(bookingId, { status: newStatus });

    // Emitir evento de Socket.io para cambio de estado
    await this.emitBookingUpdated(bookingId, oldStatus, newStatus);

    return updated;
  }

  async deleteBooking(bookingId) {
    const booking = await this.getBookingById(bookingId);

    // Emitir evento de Socket.io antes de eliminar
    await this.emitBookingDeleted(bookingId, booking.clientName);

    return this.bookingsRepository.deleteOne(bookingId);
  }

  async addServiceToBooking(bookingId, serviceId) {
    const booking = await this.getBookingById(bookingId);

    const service = await this.servicesRepository.getById(serviceId);
    if (!service) throw new NotFoundError("Servicio no encontrado");

    const services = booking.services.map((item) => ({ ...item }));

    const item = services.find((s) => String(s.service) === String(service._id));

    if (item) {
      item.quantity += 1;
    } else {
      services.push({ service: service._id, quantity: 1 });
    }

    return this.bookingsRepository.update(bookingId, { services });
  }
}
