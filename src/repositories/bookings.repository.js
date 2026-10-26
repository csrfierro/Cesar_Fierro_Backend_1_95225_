import BookingsDAO from "../dao/mongo/bookings.mongo.dao.js";

// NOTA: acceso a datos de reservas, sin reglas de negocio (ver services.repository.js).
// CAMBIO: el import apunta al DAO de MongoDB. Como el repository solo conoce la interfaz
// del DAO (getAll, create, getById, update), el resto del proyecto no se entera del cambio.

export default class BookingsRepository {
  // El constructor corre una sola vez, cuando se hace: new BookingsRepository()
  //
  // "dao = new BookingsDAO()" es un valor por defecto:
  //   - Si no pasan nada, se crea un DAO nuevo.
  //   - Si pasan uno (por ejemplo, uno de prueba), se usa ese.
  //
  // "new BookingsDAO()" crea un objeto nuevo que toma los metodos de la clase que va
  // DESPUES de new (BookingsDAO, ahora la version de MongoDB), no de la clase donde
  // esta escrita esta linea (BookingsRepository).
  constructor(dao = new BookingsDAO()) {
    // this = el repository que se esta creando.
    // Guarda el dao en una propiedad para que los demas metodos lo puedan usar
    // como this.dao.
    this.dao = dao;
  }

  // Ejemplo de uso: this.dao.getAll()
  //   this -> este repository
  //   .dao -> el DAO que guarde en el constructor
  //   .getAll() -> ejecuta ese metodo del DAO
  // CAMBIO: acepta un filtro opcional (ej: { status: "pendiente" }) y se lo pasa al DAO
  getAll(filter) {
    return this.dao.getAll(filter);
  }

  create(data) {
    return this.dao.create(data);
  }

  getById(id) {
    return this.dao.getById(id);
  }

  update(id, changes) {
    return this.dao.update(id, changes);
  }
}
