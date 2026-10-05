import fs from "node:fs/promises";
import path from "node:path";

const DEFAULT_PATH = path.join( //acepta cualquier cantidad de segmentos de ruta (mínimo 1), todos deben ser strings
  import.meta.dirname,  // → "/home/user/proyecto/src/managers"  (string 1: dónde estoy)
  "..",                 // → sube un nivel → "src"              (string 2: subir)
  "data",               // → entra a la carpeta data             (string 3: bajar)
  "bookings.json"       // → el archivo concreto                 (string 4: archivo)
);

// Campos obligatorios al crear una reserva (el id se genera solo y services arranca vacio)
const REQUIRED_FIELDS = ["clientName", "clientEmail", "date", "time"];


export default class BookingManager {
  constructor(filePath = DEFAULT_PATH) {
    this.path = filePath;
  }

  async #readFile() {
    try {
      const data = await fs.readFile(this.path, "utf-8");
      return JSON.parse(data);
    } catch (error) {
      if (error.code === "ENOENT") return [];
      throw error;
    }
  }

  async #writeFile(bookings) {
    await fs.writeFile(this.path, JSON.stringify(bookings, null, 2));
  }

  #generateId(bookings) {
    return bookings.length > 0 ? Math.max(...bookings.map((b) => b.id)) + 1 : 1;
  }

async getBookings({status}={}) {
  let bookings = await this.#readFile();
  if (status) {
    bookings = bookings.filter((b) => b.status === status);
  }
  return bookings;
}

  // Crea una reserva con services vacio. Lanza Error si faltan campos o si mandan id.
  async createBooking(bookingData = {}) {
    const missingFields = REQUIRED_FIELDS.filter(
      (field) =>
        bookingData[field] === undefined ||
        bookingData[field] === null ||
        bookingData[field] === "",
    );

    if (missingFields.length > 0) {
      throw new Error(
        `Reserva incompleta. Faltan los campos: ${missingFields.join(", ")}`,
      );
    }

    if ("id" in bookingData) {
      throw new Error("El id se genera automaticamente y no se puede enviar");
    }

    const bookings = await this.#readFile();

    const newBooking = {
      id: this.#generateId(bookings),
      clientName: bookingData.clientName,       //obligatorio
      clientEmail: bookingData.clientEmail,     //obligatorio
      date: bookingData.date,                   //obligatorio
      time: bookingData.time,                   //obligatorio
      status: bookingData.status ?? "pendiente",//opcional/pendiente por defecto
      services: [],
    };

    bookings.push(newBooking);
    await this.#writeFile(bookings);

    return newBooking;
  }

  // Devuelve la reserva o null si no existe
  async getBookingById(id) {
    const bookings = await this.#readFile();
    return bookings.find((booking) => booking.id === Number(id)) ?? null;
  }

  // Agrega un servicio a la reserva: si ya estaba, suma 1 a quantity.
  // Devuelve la reserva actualizada o null si la reserva no existe.
  // (La validacion de que el servicio exista la hace el router con ServiceManager.)
  async addServiceToBooking(bookingId, serviceId) {
    const bookings = await this.#readFile();
    const booking = bookings.find((b) => b.id === Number(bookingId));

    if (!booking) return null;

    const item = booking.services.find((s) => s.service === Number(serviceId));

    if (item) {
      item.quantity += 1;
    } else {
      booking.services.push({ service: Number(serviceId), quantity: 1 });
    }

    await this.#writeFile(bookings);
    return booking;
  }
}
