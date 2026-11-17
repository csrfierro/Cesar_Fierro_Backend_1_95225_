import ServicesRepository from "../repositories/services.repository.js";
import { ValidationError, NotFoundError } from "../utils/errors.js";
import { validateServiceCreate, validateServiceUpdate } from "../validators/service.validator.js";

export default class ServicesService {
  constructor(repository = new ServicesRepository()) {
    this.repository = repository;
  }

  async getServices({ category, available, page, limit, sortBy, order } = {}) {
    let filter = {};
    let sort = {};

    // --- Filtros ---

    if (category) {
      filter.category = category;
    }

    if (available !== undefined) {
      const availableBool = available === true || available === "true";
      filter.available = availableBool;
    }

    // --- Ordenamiento ---

    const validSortFields = ["name", "price", "duration", "category", "createdAt"];
    const defaultSortField = "createdAt";
    const sortField = validSortFields.includes(sortBy) ? sortBy : defaultSortField;
    const sortOrder = order === "desc" ? -1 : 1;
    sort[sortField] = sortOrder;

    // --- Paginacion ---

    let pageNum = parseInt(page, 10);
    if (isNaN(pageNum) || pageNum < 1) pageNum = 1;

    let limitNum = parseInt(limit, 10);
    if (isNaN(limitNum) || limitNum < 1) limitNum = 10;
    if (limitNum > 100) limitNum = 100; // maximo permitido

    // Contar documentos que coinciden con el filtro
    const total = await this.repository.countByFilter(filter);

    // Obtener servicios paginados y ordenados
    const services = await this.repository.getByFiltersWithPagination({ filter, sort, skip: (pageNum - 1) * limitNum, limit: limitNum });

    const totalPages = Math.ceil(total / limitNum);

    return {
      data: services,
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages,
        hasPrevPage: pageNum > 1,
        hasNextPage: pageNum < totalPages,
      },
    };
  }

  async getServiceById(id) {
    const service = await this.repository.getById(id);
    if (!service) throw new NotFoundError("Servicio no encontrado");
    return service;
  }

  async createService(serviceData = {}) {
    // Primero validamos con Zod: lanza error si los datos son invalidos
    const validatedData = validateServiceCreate(serviceData);

    return this.repository.create(validatedData);
  }

  async updateService(id, updatedData = {}) {
    // Primero la existencia (404) y despues las validaciones con Zod
    await this.getServiceById(id);

    // Validar solo los campos que se estan actualizando
    const validatedData = validateServiceUpdate(updatedData);

    return this.repository.update(id, validatedData);
  }

  async deleteService(id) {
    const deletedService = await this.repository.delete(id);
    if (!deletedService) throw new NotFoundError("Servicio no encontrado");
    return deletedService;
  }
}
