import ServicesDAO from "../dao/mongo/services.mongo.dao.js";

// NOTA: el repository ofrece metodos de acceso a datos y esconde COMO se guardan.
// Antes delegaba en un DAO de archivos JSON; ahora delega en el DAO de MongoDB y el
// service ni se entera (solo cambio el import de arriba). No tiene reglas de negocio.
export default class ServicesRepository {
  constructor(dao = new ServicesDAO()) {
    this.dao = dao;
  }

  getAll() {
    return this.dao.getAll();
  }

  getById(id) {
    return this.dao.getById(id);
  }

  create(data) {
    return this.dao.create(data);
  }

  update(id, changes) {
    return this.dao.update(id, changes);
  }

  delete(id) {
    return this.dao.delete(id);
  }
}
