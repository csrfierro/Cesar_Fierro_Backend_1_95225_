import { ValidationError, NotFoundError } from "./errors.js";

// NOTA: lo usan los controllers (unica capa que conoce res). Traduce el error del service
// a un codigo HTTP; cualquier otro error inesperado (ej: falla al leer el archivo) es 500.
export const responderError = (res, error) => {
  let statusCode = 500;
  if (error instanceof ValidationError) statusCode = 400;
  else if (error instanceof NotFoundError) statusCode = 404;

  res.status(statusCode).json({ status: "error", message: error.message });
};
