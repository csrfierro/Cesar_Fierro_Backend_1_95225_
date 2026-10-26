import mongoose from "mongoose";

// Cada item de la reserva: que servicio es y cuantas veces se agrego.
// _id: false evita que Mongoose le ponga un _id propio a cada item del array.
const bookingServiceSchema = new mongoose.Schema(
  {
    service: { type: mongoose.Schema.Types.ObjectId, ref: "Service", required: true },
    quantity: { type: Number, required: true, min: 1, default: 1 },
  },
  { _id: false }
);

const bookingSchema = new mongoose.Schema(
  {
    clientName: { type: String, required: true },
    clientEmail: { type: String, required: true },
    date: { type: String, required: true }, // "2026-10-10", igual que en el JSON
    time: { type: String, required: true }, // "10:00"
    status: { type: String, default: "pendiente" },
    services: { type: [bookingServiceSchema], default: [] },
  },
  { timestamps: true }
);

export const BookingModel = mongoose.model("Booking", bookingSchema);
