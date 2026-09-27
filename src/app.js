// ===== 1. IMPORTACIONES =====
import express from "express";
import servicesRouter from "./routes/services.router.js";

// ===== 2. CREACIÓN DE LA APP =====
// NOTA: acá ya NO se crea el ServiceManager ni se define app.listen. app.js ahora solo
// arma la aplicación (middlewares + rutas) y la exporta. Quien la arranca es server.js.
const app = express();

// ===== 3. MIDDLEWARE =====
app.use(express.json());

// ---------- Medir cuánto tarda cada petición ----------
const medirTiempo = (req, res, next) => {
  const inicio = Date.now();

  res.on("finish", () => {
    const ms = Date.now() - inicio;
    console.log(`${req.method} ${req.url} -> ${res.statusCode} (${ms} ms)`);
  });

  next();
};

app.use(medirTiempo);

// ===== 4. RUTA RAÍZ =====
app.get("/", (req, res) => {
  res.status(200).json({
    status: "correcto",
    message: "API del Sistema de Turnos y Reservas",
  });
});

// ===== 5. RUTAS DE SERVICIOS =====
// NOTA: todo lo que antes eran app.get/post/put/delete("/api/services...") ahora vive en
// services.router.js. Acá solo se "engancha" ese router bajo el prefijo /api/services.
// Por eso adentro del router las rutas están escritas como "/" y "/:sid", sin repetir el
// prefijo: Express se lo antepone automáticamente.
app.use("/api/services", servicesRouter);

// ===== RUTA NO ENCONTRADA (404) =====
const rutaNoEncontrada = (req, res) => {
  res.status(404).json({
    status: "error",
    message: `Ruta no encontrada: ${req.method} ${req.url}`,
  });
};

app.use(rutaNoEncontrada);

// NOTA: export default en vez de app.listen. server.js es quien importa esto y lo levanta.
export default app;
