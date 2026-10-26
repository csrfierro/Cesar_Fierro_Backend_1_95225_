// NOTA: valida que bid y/o sid (los que existan en la URL) sean numeros.
export const validarIds = (req, res, next) => {
  for (const [param, value] of Object.entries(req.params)) {
    if (Number.isNaN(Number(value))) {
      return res.status(400).json({
        status: "error",
        message: `El parametro ${param} debe ser un número`,
      });
    }
  }
  next();
};
