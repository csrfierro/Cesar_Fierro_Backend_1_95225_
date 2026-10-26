import mongoose from "mongoose";
import { BookingModel } from "../models/booking.model.js";

// NOTA: misma interfaz que bookings.dao.js (getAll, create, getById, update).
// La logica de "si el servicio ya estaba, sumar quantity" sigue en bookings.service.js, no aca.
export default class BookingsMongoDAO {
  // El filtro es opcional: getAll() trae todo y getAll({ status: "pending" }) filtra en la base
  async getAll(filter = {}) {
    return BookingModel.find(filter).lean();
  }

  async create(data) {
    const newBooking = await BookingModel.create(data);
    return newBooking.toObject();
  }

  async getById(id) {
    if (!mongoose.isValidObjectId(id)) return null;
    return BookingModel.findById(id).lean();
  }

  // Devuelve la reserva actualizada o null si no existe
  async update(id, changes) {
    if (!mongoose.isValidObjectId(id)) return null;

    const { _id, id: ignoredId, ...safeChanges } = changes;

    return BookingModel.findByIdAndUpdate(id, safeChanges, {
      new: true,
      runValidators: true,
    }).lean();
  }
}
