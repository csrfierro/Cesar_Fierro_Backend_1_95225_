import BookingsDAO from "../dao/bookings.dao.js";

// NOTA: acceso a datos de reservas, sin reglas de negocio (ver services.repository.js).


 // El constructor corre una sola vez, cuando se hace: new BookingsRepository()
  //
  // "dao = new BookingsDAO()" es un valor por defecto:
  //   - Si no pasan nada, se crea un DAO nuevo.
  //   - Si pasan uno (por ejemplo, uno de prueba), se usa ese.
  //
  // "new BookingsDAO()" funciona como apretar un molde sobre la masa: crea un objeto
  // nuevo que toma los métodos de la clase que va DESPUÉS de new (BookingsDAO),
  // no de la clase donde está escrita esta línea (BookingsRepository).
  //
  // El objeto dao queda así: una ficha con un solo dato y un manual compartido.
  //   dao
  //    ├── path: "C:\\proyecto\\src\\data\\bookings.json"   <- único dato propio
  //    └── (hereda de BookingsDAO) getAll, create, getById, update

export default class BookingsRepository {
  constructor(dao = new BookingsDAO()) {
        // this = el repository que se está creando.
    // Guarda el dao en una propiedad para que los demás métodos lo puedan usar
    // como this.dao.
    this.dao = dao;
  }

 // Ejemplo de uso: this.dao.getAll()
  //   this -> este repository
  //   .dao -> el DAO que guardé en el constructor
  //   .getAll() -> ejecuta ese método del DAO
  getAll() {
    return this.dao.getAll();
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
