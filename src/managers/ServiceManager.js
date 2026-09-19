import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_PATH = path.join(__dirname, '..', 'data', 'services.json');

// Campos que forman un servicio (sin el id, que se genera internamente)
const SERVICE_FIELDS = ['name', 'description', 'duration', 'price', 'category', 'available'];

export default class ServiceManager {
    constructor(filePath = DEFAULT_PATH) {
        this.path = filePath;
    }

    async #readFile() {
        try {
            const data = await fs.readFile(this.path, 'utf-8');
            return JSON.parse(data);
        } catch (error) {
            // Si el archivo todavia no existe, arrancamos con una lista vacia
            if (error.code === 'ENOENT') return [];
            throw error;
        }
    }

    async #writeFile(services) {
        await fs.writeFile(this.path, JSON.stringify(services, null, 2));
    }

    #generateId(services) {
        // Maximo id + 1: evita repetir ids si se eliminaron servicios
        return services.length > 0 ? Math.max(...services.map((s) => s.id)) + 1 : 1;
    }

    // Devuelve todos los servicios
    async getServices() {
        return await this.#readFile();
    }

    // Devuelve el servicio o null si no existe
    async getServiceById(id) {
        const services = await this.#readFile();
        return services.find((service) => service.id === Number(id)) ?? null;
    }

    // Agrega un servicio. El id se genera solo; lanza un Error si faltan campos
    async addService(serviceData = {}) {
        // available puede ser false, por eso se compara contra undefined/null/''
        const missingFields = SERVICE_FIELDS.filter(
            (field) =>
                serviceData[field] === undefined ||
                serviceData[field] === null ||
                serviceData[field] === ''
        );

        if (missingFields.length > 0) {
            throw new Error(`Servicio incompleto. Faltan los campos: ${missingFields.join(', ')}`);
        }

        const services = await this.#readFile();

        const newService = { id: this.#generateId(services) };
        for (const field of SERVICE_FIELDS) {
            newService[field] = serviceData[field];
        }

        services.push(newService);
        await this.#writeFile(services);

        return newService;
    }

    // Actualiza un servicio. Ignora el id recibido; devuelve null si no existe
    async updateService(id, updatedData = {}) {
        const services = await this.#readFile();
        const index = services.findIndex((service) => service.id === Number(id));

        if (index === -1) return null;

        const changes = {};
        for (const field of SERVICE_FIELDS) {
            if (updatedData[field] !== undefined) {
                changes[field] = updatedData[field];
            }
        }

        services[index] = { ...services[index], ...changes, id: services[index].id };
        await this.#writeFile(services);

        return services[index];
    }

    // Elimina un servicio y lo devuelve; devuelve null si no existe
    async deleteService(id) {
        const services = await this.#readFile();
        const index = services.findIndex((service) => service.id === Number(id));

        if (index === -1) return null;

        const [deletedService] = services.splice(index, 1);
        await this.#writeFile(services);

        return deletedService;
    }
}
