import ServicesRepository from "../repositories/services.repository.js";
import { ValidationError, NotFoundError } from "../utils/errors.js";

// NOTA: el service contiene las REGLAS DE NEGOCIO (validaciones, filtros, que pasa si no
// existe). No conoce req/res ni el archivo JSON: pide los datos al repository y, si algo
// esta mal, lanza ValidationError / NotFoundError; el controller decide el codigo HTTP.

const SERVICE_FIELDS = ["name", "description", "duration", "price", "category", "available"];

const isNonEmptyString = (value) => typeof value === "string" && value.trim() !== "";
const isPositiveNumber = (value) =>
  typeof value === "number" && Number.isFinite(value) && value > 0;

const FIELD_RULES = {
  name: { isValid: isNonEmptyString, message: "name debe ser un texto no vacio" },
  description: { isValid: isNonEmptyString, message: "description debe ser un texto no vacio" },
  duration: { isValid: isPositiveNumber, message: "duration debe ser un numero mayor a 0" },
  price: { isValid: isPositiveNumber, message: "price debe ser un numero mayor a 0" },
  category: { isValid: isNonEmptyString, message: "category debe ser un texto no vacio" },
  available: {
    isValid: (value) => typeof value === "boolean",
    message: "available debe ser true o false",
  },
};

// Mensajes de error de los campos que SI vinieron (los undefined se saltean)
function getValidationErrors(data) {
  return SERVICE_FIELDS.filter(
    (field) => data[field] !== undefined && !FIELD_RULES[field].isValid(data[field]),
  ).map((field) => FIELD_RULES[field].message);
}

export default class ServicesService {
  constructor(repository = new ServicesRepository()) {
    this.repository = repository;
  }

  async getServices({ category, available } = {}) {
    let services = await this.repository.getAll();

    if (category) {
      services = services.filter((service) => service.category === category);
    }

    // Desde la URL llega TEXTO; solo se aceptan 'true' o 'false'
    if (available !== undefined) {
      const availableText = String(available);
      if (availableText !== "true" && availableText !== "false") {
        throw new ValidationError("El filtro available debe ser true o false");
      }
      const isAvailable = availableText === "true";
      services = services.filter((service) => service.available === isAvailable);
    }

    return services;
  }

  async getServiceById(id) {
    const service = await this.repository.getById(id);
    if (!service) throw new NotFoundError("Servicio no encontrado");
    return service;
  }

  async createService(serviceData = {}) {
    const missingFields = SERVICE_FIELDS.filter(
      (field) =>
        serviceData[field] === undefined ||
        serviceData[field] === null ||
        serviceData[field] === "",
    );
    if (missingFields.length > 0) {
      throw new ValidationError(
        `Servicio incompleto. Faltan los campos: ${missingFields.join(", ")}`,
      );
    }

    if ("id" in serviceData) {
      throw new ValidationError("El id se genera automaticamente y no se puede enviar");
    }

    const typeErrors = getValidationErrors(serviceData);
    if (typeErrors.length > 0) {
      throw new ValidationError(`Datos invalidos: ${typeErrors.join(", ")}`);
    }

    // Solo se copian los campos permitidos: cualquier campo extra se descarta
    const newService = {};
    for (const field of SERVICE_FIELDS) {
      newService[field] = serviceData[field];
    }

    return this.repository.create(newService);
  }

  async updateService(id, updatedData = {}) {
    // Primero la existencia (404) y despues los tipos (400), igual que antes del refactor
    await this.getServiceById(id);

    const typeErrors = getValidationErrors(updatedData);
    if (typeErrors.length > 0) {
      throw new ValidationError(`Datos invalidos: ${typeErrors.join(", ")}`);
    }

    const changes = {};
    for (const field of SERVICE_FIELDS) {
      if (updatedData[field] !== undefined) {
        changes[field] = updatedData[field];
      }
    }

    return this.repository.update(id, changes);
  }

  async deleteService(id) {
    const deletedService = await this.repository.delete(id);
    if (!deletedService) throw new NotFoundError("Servicio no encontrado");
    return deletedService;
  }
}
