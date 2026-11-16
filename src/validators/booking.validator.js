import { z } from "zod";

/**
 * Schema para CREAR una reserva.
 */
export const bookingCreateSchema = z.object({
  clientName: z
    .string()
    .min(1, "clientName debe ser un texto no vacio")
    .trim(),
  clientEmail: z
    .string()
    .email("clientEmail debe ser un email valido")
    .trim(),
  date: z
    .string()
    .min(1, "date es obligatorio (formato: YYYY-MM-DD)")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "date debe estar en formato YYYY-MM-DD"),
  time: z
    .string()
    .min(1, "time es obligatorio (formato: HH:MM)")
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "time debe estar en formato HH:MM (24h)"),
  status: z
    .string()
    .optional()
    .default("pendiente"),
});

/**
 * Schema para AGREGAR un servicio a una reserva.
 */
export const serviceToBookingSchema = z.object({
  quantity: z
    .number()
    .int("quantity debe ser un numero entero")
    .min(1, "quantity debe ser al menos 1")
    .default(1),
});

/**
 * Validar datos de creacion de reserva y devolver el objeto limpio o lanzar ValidationError.
 */
export const validateBookingCreate = (data) => {
  const result = bookingCreateSchema.safeParse(data);
  if (!result.success) {
    const messages = result.error.errors.map(
      (e) => `${e.path.join(".")}: ${e.message}`
    );
    throw new Error(`Datos invalidos: ${messages.join(", ")}`);
  }
  return result.data;
};

/**
 * Validar datos para agregar servicio a reserva y devolver el objeto limpio o lanzar ValidationError.
 */
export const validateServiceToBooking = (data) => {
  const result = serviceToBookingSchema.safeParse(data);
  if (!result.success) {
    const messages = result.error.errors.map(
      (e) => `${e.path.join(".")}: ${e.message}`
    );
    throw new Error(`Datos invalidos: ${messages.join(", ")}`);
  }
  return result.data;
};
