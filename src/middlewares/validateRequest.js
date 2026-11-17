// NOTA: middleware genico que aplica un schema Zod a req.body, req.params o req.query.
// Se usa para validar datos antes de llegar al controller/service.

/**
 * Middleware que valida los datos contra un schema Zod.
 * @param {import('zod').ZodType} schema - Schema Zod a aplicar
 * @param {string} source - Donde tomar los datos: 'body', 'params' o 'query' (default: 'body')
 */
export const validateRequest = (schema, source = "body") => {
  return (req, res, next) => {
    const data = req[source];

    const result = schema.safeParse(data);

    if (!result.success) {
      const messages = result.error.errors.map(
        (e) => `${e.path.join(".")}: ${e.message}`
      );
      return res.status(400).json({
        status: "error",
        message: `Validacion fallida en ${source}: ${messages.join(", ")}`,
        errors: result.error.errors,
      });
    }

    // Si pasaron la validacion, asignar datos limpios (Zod coerce tipos automaticamente)
    req[source] = result.data;
    next();
  };
};
