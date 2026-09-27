import fs from "node:fs/promises";
import path from "node:path";


const DEFAULT_PATH = path.join( //acepta cualquier cantidad de segmentos de ruta (mínimo 1), todos deben ser strings
  import.meta.dirname,  // → "/home/user/proyecto/src/managers"  (string 1: dónde estoy)
  "..",                 // → sube un nivel → "src"              (string 2: subir)
  "data",               // → entra a la carpeta data             (string 3: bajar)
  "services.json"       // → el archivo concreto                 (string 4: archivo)
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

  // NOTA: este bloque comentado es la version vieja (sin filtros). Ya no se usa, se puede borrar.
  // // Devuelve todos los servicios
  // async getServices() {
  //   return await this.#readFile();
  // }


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
        // Convierte a booleano real: desde la URL llega el texto 'true' y en el JSON
        // available es un booleano; para comparar con === tienen que ser del mismo tipo.
        const isAvailable = String(available) === 'true';
        services = services.filter((service) => service.available === isAvailable);
    }

    return services;
}


  // Devuelve el servicio o null si no existe
  // NOTA: Number(id) porque el id llega como texto desde la URL y en el JSON es numero
  async getServiceById(id) {
    const services = await this.#readFile();
    return services.find((service) => service.id === Number(id)) ?? null;
  }

  // Agrega un servicio. El id se genera solo; lanza un Error si faltan campos
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
      throw new Error(
        `Servicio incompleto. Faltan los campos: ${missingFields.join(", ")}`,
      );
    }

    // NOTA: "id" in serviceData pregunta si el objeto trae una propiedad id. Si la trae, se rechaza.
    if ("id" in serviceData) {
      throw new Error("El id se genera automaticamente y no se puede enviar");
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

  // Actualiza un servicio. Ignora el id recibido; devuelve null si no existe
  // NOTA: "= {}" cubre el caso de un PUT sin body (en Express 5 req.body queda undefined)
  async updateService(id, updatedData = {}) {
    const services = await this.#readFile();
    const index = services.findIndex((service) => service.id === Number(id));

    // NOTA: return corta la funcion. Devuelve null a quien llamo (la ruta lo usa para el 404)
    // y no se llega a #writeFile, asi que el archivo no se toca.
    if (index === -1) return null;

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
      id: services[index].id,
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