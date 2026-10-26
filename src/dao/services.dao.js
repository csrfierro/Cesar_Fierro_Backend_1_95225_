import fs from "node:fs/promises";
import path from "node:path";

const DEFAULT_PATH = path.join(import.meta.dirname, "..", "data", "services.json");

// NOTA: el DAO es la UNICA capa que toca el archivo JSON. No valida ni decide nada:
// lee, escribe y devuelve lo que se le pide.
export default class ServicesDAO {
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

  async #writeFile(services) {
    await fs.writeFile(this.path, JSON.stringify(services, null, 2));
  }

  // NOTA: generar el id es un detalle de la persistencia (como el _id que despues
  // asignara MongoDB), no una regla de negocio.
  #generateId(services) {
    return services.length > 0 ? Math.max(...services.map((s) => s.id)) + 1 : 1;
  }

  async getAll() {
    return this.#readFile();
  }

  async getById(id) {
    const services = await this.#readFile();
    return services.find((service) => service.id === Number(id)) ?? null;
  }

  async create(data) {
    const services = await this.#readFile();
    const newService = { id: this.#generateId(services), ...data };
    services.push(newService);
    await this.#writeFile(services);
    return newService;
  }

  // Devuelve el servicio actualizado o null si no existe
  async update(id, changes) {
    const services = await this.#readFile();
    const index = services.findIndex((service) => service.id === Number(id));
    if (index === -1) return null;

    services[index] = { ...services[index], ...changes, id: services[index].id };
    await this.#writeFile(services);
    return services[index];
  }

  // Devuelve el servicio eliminado o null si no existe
  async delete(id) {
    const services = await this.#readFile();
    const index = services.findIndex((service) => service.id === Number(id));
    if (index === -1) return null;

    const [deletedService] = services.splice(index, 1);
    await this.#writeFile(services);
    return deletedService;
  }
}
