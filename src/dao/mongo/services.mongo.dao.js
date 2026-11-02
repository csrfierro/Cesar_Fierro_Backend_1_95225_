import mongoose from "mongoose";
import { ServiceModel } from "../models/service.model.js";

// NOTA: misma interfaz que services.dao.js (getAll, getById, create, update, delete)
// y mismo contrato: devuelve null si el recurso no existe. Sigue sin reglas de negocio.
// .lean() devuelve objetos planos de JS (no documentos de Mongoose), como hacia el DAO de JSON.
export default class ServicesMongoDAO {
  async getAll() {
    return ServiceModel.find().lean();
  }

  async getById(id) {
    // Un id con formato invalido haria que Mongoose tire CastError; lo tratamos como "no existe"
    if (!mongoose.isValidObjectId(id)) return null;
    return ServiceModel.findById(id).lean();
  }

  async create(data) {
    const newService = await ServiceModel.create(data);
    return newService.toObject();
  }

  // Devuelve el servicio actualizado o null si no existe
  async update(id, changes) {
    if (!mongoose.isValidObjectId(id)) return null;

    // Igual que antes, el id no se puede modificar
    const { _id, id: ignoredId, ...safeChanges } = changes;

    return ServiceModel.findByIdAndUpdate(id, safeChanges, {
      new: true, // devuelve el documento ya actualizado
      runValidators: true, // aplica las validaciones del schema tambien en el update
    }).lean();
  }

  // Devuelve el servicio eliminado o null si no existe
  async delete(id) {
    if (!mongoose.isValidObjectId(id)) return null;
    return ServiceModel.findByIdAndDelete(id).lean();
  }
}
