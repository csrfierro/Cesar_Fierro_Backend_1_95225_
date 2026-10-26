import fs from "node:fs/promises";
import path from "node:path";

const DEFAULT_PATH = path.join(import.meta.dirname, "..", "data", "bookings.json");

// NOTA: igual que services.dao.js: solo lee y escribe bookings.json, sin reglas de negocio.
// La logica de "si el servicio ya estaba, sumar quantity" NO va aca: esta en bookings.service.js.
export default class BookingsDAO {
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

  // NOTA: getAll no esta en la lista de la consigna, pero hace falta para mantener
  // el GET /api/bookings (con filtro ?status=) que ya existia.
  async getAll() {
    return this.#readFile();
  }

  async create(data) {
    const bookings = await this.#readFile();
    const newBooking = { id: this.#generateId(bookings), ...data };
    bookings.push(newBooking);
    await this.#writeFile(bookings);
    return newBooking;
  }

  async getById(id) {
    const bookings = await this.#readFile();
    return bookings.find((booking) => booking.id === Number(id)) ?? null;
  }

  // Devuelve la reserva actualizada o null si no existe
  async update(id, changes) {
    const bookings = await this.#readFile();
    const index = bookings.findIndex((booking) => booking.id === Number(id));
    if (index === -1) return null;

    bookings[index] = { ...bookings[index], ...changes, id: bookings[index].id };
    await this.#writeFile(bookings);
    return bookings[index];
  }
}
