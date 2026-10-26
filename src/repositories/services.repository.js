import ServicesDAO from "../dao/services.dao.js";

// NOTA: el repository ofrece metodos de acceso a datos y esconde COMO se guardan.
// Hoy delega en un DAO de archivos JSON; cuando se migre a MongoDB solo se cambia el DAO
// (o se inyecta otro) y el service ni se entera. No tiene reglas de negocio.
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
