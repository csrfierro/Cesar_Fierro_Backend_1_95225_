import { z } from "zod";

/**
 * Schema para CREAR un servicio.
 * Todos los campos del modelo: name, description, duration, price, category, available.
 */
export const serviceCreateSchema = z.object({
  name: z
    .string()
    .min(1, "name debe ser un texto no vacio")
    .trim(),
  description: z
    .string()
    .min(1, "description debe ser un texto no vacio")
    .trim(),
  duration: z
    .number()
    .positive("duration debe ser un numero mayor a 0"),
  price: z
    .number()
    .positive("price debe ser un numero mayor a 0"),
  category: z
    .string()
    .min(1, "category debe ser un texto no vacio")
    .trim(),
  available: z
    .boolean()
    .optional()
    .default(true),
});

/**
 * Schema para ACTUALIZAR un servicio (todos los campos son opcionales).
 */
export const serviceUpdateSchema = z.object({
  name: z
    .string()
    .min(1, "name debe ser un texto no vacio")
    .trim()
    .optional(),
  description: z
    .string()
    .min(1, "description debe ser un texto no vacio")
    .trim()
    .optional(),
  duration: z
    .number()
    .positive("duration debe ser un numero mayor a 0")
    .optional(),
  price: z
    .number()
    .positive("price debe ser un numero mayor a 0")
    .optional(),
  category: z
    .string()
    .min(1, "category debe ser un texto no vacio")
    .trim()
    .optional(),
  available: z.boolean().optional(),
});

/**
 * Validar datos de creacion y devolver el objeto limpio o lanzar ValidationError.
 */
export const validateServiceCreate = (data) => {
  const result = serviceCreateSchema.safeParse(data);
  if (!result.success) {
    const messages = result.error.errors.map(
      (e) => `${e.path.join(".")}: ${e.message}`
    );
    throw new Error(`Datos invalidos: ${messages.join(", ")}`);
  }
  return result.data;
};

/**
 * Validar datos de actualizacion y devolver el objeto limpio o lanzar ValidationError.
 */
export const validateServiceUpdate = (data) => {
  const result = serviceUpdateSchema.safeParse(data);
  if (!result.success) {
    const messages = result.error.errors.map(
      (e) => `${e.path.join(".")}: ${e.message}`
    );
    throw new Error(`Datos invalidos: ${messages.join(", ")}`);
  }
  return result.data;
};
