import ServicesService from "../services/services.service.js";
import { responderError } from "../utils/responderError.js";

// NOTA: el controller es la unica capa (junto al router) que conoce req/res. Lee la peticion,
// llama al service y arma la respuesta. Las reglas de negocio y los errores los resuelve el service.
const servicesService = new ServicesService();

// GET /api/services -> todos los servicios (filtros opcionales ?category= y ?available=)
export const getServices = async (req, res) => {
  try {
    const { category, available } = req.query;
    const services = await servicesService.getServices({ category, available });
    res.status(200).json({ status: "correcto", payload: services });
  } catch (error) {
    responderError(res, error);
  }
};

// GET /api/services/:sid -> un servicio por id
export const getServiceById = async (req, res) => {
  try {
    const service = await servicesService.getServiceById(req.params.sid);
    res.status(200).json({ status: "correcto", payload: service });
  } catch (error) {
    responderError(res, error);
  }
};

// POST /api/services -> crea un servicio
export const createService = async (req, res) => {
  try {
    const newService = await servicesService.createService(req.body);
    res.status(201).json({ status: "correcto", payload: newService });
  } catch (error) {
    responderError(res, error);
  }
};

// PUT /api/services/:sid -> actualiza un servicio
export const updateService = async (req, res) => {
  try {
    const updatedService = await servicesService.updateService(req.params.sid, req.body);
    res.status(200).json({ status: "correcto", payload: updatedService });
  } catch (error) {
    responderError(res, error);
  }
};

// DELETE /api/services/:sid -> elimina un servicio
export const deleteService = async (req, res) => {
  try {
    const deletedService = await servicesService.deleteService(req.params.sid);
    res.status(200).json({ status: "correcto", payload: deletedService });
  } catch (error) {
    responderError(res, error);
  }
};
