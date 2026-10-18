import fs from "node:fs/promises";
import path from "node:path";

const DEFAULT_PATH = path.join(
  //acepta cualquier cantidad de segmentos de ruta (mínimo 1), todos deben ser strings
  import.meta.dirname, // → "/home/user/proyecto/src/managers"  (string 1: dónde estoy)
  "..", // → sube un nivel → "src"              (string 2: subir)
  "data", // → entra a la carpeta data             (string 3: bajar)
  "services.json", // → el archivo concreto                 (string 4: archivo)
);
// Resultado: "/home/user/proyecto/src/data/services.json"

// Campos que forman un servicio (sin el id, que se genera internamente)
// NOTA: esta lista se usa para validar, para copiar campos al crear y para actualizar.
// Si algun dia se agrega un campo, se suma aca y el resto se adapta.
const SERVICE_FIELDS = [
  "name",
  "description",
  "duration",
  "price",
  "category",
  "available",
];
// NOTA: error propio para datos invalidos (culpa del cliente). Hereda de Error, asi que se
// lanza con throw y tiene .message; sin constructor, JavaScript guarda el mensaje solo.
// El controller lo distingue con: error instanceof ValidationError ? 400 : 500
export class ValidationError extends Error {};

// NOTA: reglas de tipo. typeof "abc" === "number" es false, asi que price: "abc" se rechaza;
// Number.isFinite tambien descarta NaN e Infinity. Para available se exige un booleano real
// (true/false), no el texto "si" ni "true".
const isNonEmptyString = (value) =>
  typeof value === "string" && value.trim() !== "";
const isPositiveNumber = (value) =>
  typeof value === "number" && Number.isFinite(value) && value > 0;

const FIELD_RULES = {
  name: {
    isValid: isNonEmptyString,
    message: "name debe ser un texto no vacio",
  },
  description: {
    isValid: isNonEmptyString,
    message: "description debe ser un texto no vacio",
  },
  duration: {
    isValid: isPositiveNumber,
    message: "duration debe ser un numero mayor a 0",
  },
  price: {
    isValid: isPositiveNumber,
    message: "price debe ser un numero mayor a 0",
  },
  category: {
    isValid: isNonEmptyString,
    message: "category debe ser un texto no vacio",
  },
  available: {
    isValid: (value) => typeof value === "boolean",
    message: "available debe ser true o false",
  },
};

// Devuelve la lista de mensajes de error de los campos que SI vinieron (los undefined se
// saltean). Sirve tanto para crear (donde ya se chequeo que no falte ninguno) como para
// actualizar (donde pueden venir solo algunos campos).
function getValidationErrors(data) {
  return SERVICE_FIELDS.filter(
    (field) =>
      data[field] !== undefined && !FIELD_RULES[field].isValid(data[field]),
  ).map((field) => FIELD_RULES[field].message);
}

// NOTA: los metodos publicos son async porque leen y escriben archivos (tardan).
// Quien los llama usa await para recibir el resultado (app.js, prueba.js).
export default class ServiceManager {
  // NOTA: "= DEFAULT_PATH" es un valor por defecto: si no pasan una ruta, usa services.json.
  // prueba.js pasa otra ruta para no tocar los datos reales y por eso se usa un constructor 'const manager = new ServiceManager(rutaPrueba);'
  constructor(filePath = DEFAULT_PATH) {
    this.path = filePath;
  }

  // NOTA: el # hace que el metodo sea PRIVADO: solo se puede usar dentro de la clase
  // (this.#readFile()). Desde afuera no se puede llamar.
  async #readFile() {
    try {
      // readFile devuelve TEXTO; JSON.parse lo convierte en un array de objetos
      const data = await fs.readFile(this.path, "utf-8");
      return JSON.parse(data);
    } catch (error) {
      // Si el archivo todavia no existe, arrancamos con una lista vacia
      if (error.code === "ENOENT") return [];
      throw error;
    }
  }

  // NOTA: esta es la unica parte que reescribe services.json. JSON.stringify convierte el
  // array a texto (el 2 es la sangria) y writeFile REEMPLAZA todo el contenido del archivo.
  // Hasta que se llama a #writeFile, los cambios solo existen en memoria.
  async #writeFile(services) {
    await fs.writeFile(this.path, JSON.stringify(services, null, 2));
  }

  #generateId(services) {
    // Maximo id + 1: evita repetir ids si se eliminaron servicios
    return services.length > 0 ? Math.max(...services.map((s) => s.id)) + 1 : 1;
  }

  // NOTA - Los parametros de getServices:
  // - { category, available } DESARMA el objeto que llega y saca esas dos propiedades.
  //   La ruta lo arma con getServices({ category, available }).
  // - "= {}" es el valor por defecto: si llaman getServices() sin nada, se usa un objeto vacio
  //   y category/available valen undefined (sin filtros). Sin el "= {}" daria error.
  async getServices({ category, available } = {}) {
    let services = await this.#readFile();

    // "si mandaron una categoria" -> deja solo los servicios de esa categoria
    if (category) {
      services = services.filter((service) => service.category === category);
    }

    // "si mandaron available". Se compara con !== undefined y no con if (available)
    // porque el booleano false cuenta como "falso" y no filtraria los no disponibles.
    if (available !== undefined) {
      // Desde la URL llega TEXTO ('true' o 'false'); en el JSON available es un booleano.
      // Solo se aceptan esos dos valores: si no se validara, cualquier texto raro
      // (por ejemplo 'manzana') daria false al comparar y filtraria como "no disponible".
      const availableText = String(available);
      if (availableText !== "true" && availableText !== "false") {
        throw new ValidationError("El filtro available debe ser true o false");
      }
      // Convierte a booleano real para poder comparar con === (mismo tipo)
      const isAvailable = availableText === "true";
      services = services.filter(
        (service) => service.available === isAvailable,
      );
    }

    return services;
  }

  // Devuelve el servicio o null si no existe
  // NOTA: Number(id) porque el id llega como texto desde la URL y en el JSON es numero
  async getServiceById(id) {
    const services = await this.#readFile();
    return services.find((service) => service.id === Number(id)) ?? null;
  }

  // Agrega un servicio. El id se genera solo; lanza ValidationError si faltan campos o son invalidos
  // NOTA: "= {}" evita un error raro si llaman sin datos (por ejemplo, un POST sin body):
  // asi se llega a la validacion y sale el mensaje claro de campos faltantes.
  async addService(serviceData = {}) {
    // available puede ser false, por eso se compara contra undefined/null/''
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

    // NOTA: "id" in serviceData pregunta si el objeto trae una propiedad id. Si la trae, se rechaza.
    if ("id" in serviceData) {
      throw new ValidationError(
        "El id se genera automaticamente y no se puede enviar",
      );
    }

    // Faltan campos y id ya se chequearon; ahora se valida el TIPO de cada campo
    const typeErrors = getValidationErrors(serviceData);
    if (typeErrors.length > 0) {
      throw new ValidationError(`Datos invalidos: ${typeErrors.join(", ")}`);
    }

    const services = await this.#readFile();

    // NOTA: primero se crea el objeto solo con el id (this.#generateId se ejecuta ahi mismo)
    const newService = { id: this.#generateId(services) };
    // for...of repite el bloque una vez por cada nombre de SERVICE_FIELDS; en cada vuelta
    // field vale uno distinto ("name", "description", ...). Los corchetes [field] permiten
    // usar una variable como nombre de propiedad. Solo se copian los campos de la lista,
    // por eso un id o un campo extra que manden se descarta.
    for (const field of SERVICE_FIELDS) {
      newService[field] = serviceData[field];
    }

    services.push(newService);
    await this.#writeFile(services);

    return newService;
  }

  // Actualiza un servicio. Ignora el id recibido; devuelve null si no existe.
  // Lanza ValidationError si algun campo enviado tiene un tipo invalido
  // NOTA: "= {}" cubre el caso de un PUT sin body (en Express 5 req.body queda undefined)
  async updateService(id, updatedData = {}) {
    const services = await this.#readFile();
    const index = services.findIndex((service) => service.id === Number(id));

    // NOTA: return corta la funcion. Devuelve null a quien llamo (la ruta lo usa para el 404)
    // y no se llega a #writeFile, asi que el archivo no se toca.
    if (index === -1) return null;

    // Se valida el tipo de los campos que mandaron (los que no vienen se ignoran).
    // Va despues del chequeo de existencia: un id inexistente sigue dando 404.
    const typeErrors = getValidationErrors(updatedData);
    if (typeErrors.length > 0) {
      throw new ValidationError(`Datos invalidos: ${typeErrors.join(", ")}`);
    }

    // changes junta solo los campos que mandaron (los que no son undefined)
    const changes = {};
    for (const field of SERVICE_FIELDS) {
      if (updatedData[field] !== undefined) {
        changes[field] = updatedData[field];
      }
    }

    // NOTA: ...services[index] copia el servicio original, ...changes pisa solo lo que cambio,
    // y el id se vuelve a poner al final para que nunca se pueda modificar.
    services[index] = {
      ...services[index],
      ...changes,
      id: services[index].id, //inecesario ya que en SERVICE_FIELDS no hay id por lo que no lo tendriamos en changes.
    };
    await this.#writeFile(services);

    return services[index];
  }

  // Elimina un servicio y lo devuelve; devuelve null si no existe
  async deleteService(id) {
    const services = await this.#readFile();
    const index = services.findIndex((service) => service.id === Number(id));

    if (index === -1) return null;

    // NOTA: splice saca el servicio del array (solo en memoria) y lo devuelve DENTRO de otro
    // array. Los corchetes [deletedService] sacan ese unico elemento.
    const [deletedService] = services.splice(index, 1);
    // Recien aca se reescribe services.json
    await this.#writeFile(services);

    // NOTA: el return devuelve el valor a quien llamo a deleteService: en app.js queda
    // guardado en const deletedService = await serviceManager.deleteService(sid)
    return deletedService;
  }
}
