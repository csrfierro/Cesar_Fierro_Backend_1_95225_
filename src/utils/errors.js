// NOTA: errores propios. Los services los lanzan (no conocen HTTP) y el controller
// los traduce a un codigo de estado: ValidationError -> 400, NotFoundError -> 404.
export class ValidationError extends Error {}
export class NotFoundError extends Error {}
