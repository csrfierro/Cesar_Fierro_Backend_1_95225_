// NOTA: valida que bid y/o sid (los que existan en la URL) sean numeros.
import mongoose from "mongoose";

// Valida que TODOS los parametros de la ruta (req.params) sean ObjectId de MongoDB:
// 24 caracteres hexadecimales. Sirve para /:sid, /:bid, o rutas con varios ids.
export const validarIds = (req, res, next) => {
  for (const [param, value] of Object.entries(req.params)) {
    if (!mongoose.isObjectIdOrHexString(value)) {
      return res.status(400).json({
        status: "error",
        message: `El parametro ${param} debe ser un ID válido (24 caracteres hexadecimales)`,
      });
    }
  }
  next();
};