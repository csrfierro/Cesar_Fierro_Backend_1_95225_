// NOTA: middleware: se ejecuta ANTES del controller en las rutas con ":sid".
// Si el id no es numerico corta la peticion con 400; si es valido llama a next().
export const validarId = (req, res, next) => {
  const { sid } = req.params;
  // Number("abc") da NaN; Number.isNaN() lo chequea especificamente.
  if (Number.isNaN(Number(sid))) {
    return res.status(400).json({
      status: "error",
      message: "El id debe ser un número",
    });
  }

  next();
};
