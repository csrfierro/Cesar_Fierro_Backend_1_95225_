// ===== 1. IMPORTACIONES =====

// NOTA: fileURLToPath + dirname son necesarios en ESM para simular el __dirname común en
// CommonJS. Nos permiten calcular rutas absolutas sin importar dónde se ejecutó node.
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// NOTA: Express es el framework que recibe las peticiones HTTP y las dirige a cada ruta.
// NOTA: Express es el framework que recibe las peticiones HTTP y las dirige a cada ruta.
// Se instala con npm (está en "dependencies") y se importa sin llaves porque es un
// export default: una función, express(), que crea la aplicación más abajo.
import express from "express";

// NOTA: archivo propio, por eso lleva ruta relativa ("./"), contada desde src/. La extensión
// ".js" es obligatoria en ESM. Sin llaves = export default: el router ya armado con las
// rutas de services. El nombre lo elegimos nosotros. Se engancha abajo con app.use.
import servicesRouter from "./routes/services.router.js";

// NOTA: igual que el anterior, con las rutas de reservas. Importar un router no lo activa:
// recién atiende peticiones cuando se monta con app.use("/api/bookings", bookingsRouter).
import bookingsRouter from "./routes/bookings.router.js";

// NOTA: importamos express-handlebars para poder renderizar plantillas .handlebars.
import { engine } from "express-handlebars";

// NOTA: router de vistas HTML con Handlebars (no es API JSON, muestra páginas web).
import viewsRouter from "./routes/views.router.js";

// ===== 2. CREACIÓN DE LA APP =====
// NOTA: acá ya NO se crea el ServiceManager ni se define app.listen. app.js ahora solo
// arma la aplicación (middlewares + rutas) y la exporta. Quien la arranca es server.js.
const app = express();

// ===== 3. CONFIGURAR HANDLEBARS =====
// NOTA: registramos "handlebars" como motor de plantillas; Express buscará las vistas en
// "src/views/" y los layouts en "src/views/layouts/". El layout por defecto es "main".
// También registramos helpers personalizados para la lógica en las plantillas.
app.engine(
  "handlebars",
  engine({
    defaultLayout: "main", //por esto se rennderiza main.handlebars al usar res.render (views.router.js)
    dir: "src/views",
    // NOTA: helper "eq" permite comparar valores en Handlebars, ej: {{#if (eq a b)}}.
    helpers: {
      eq: function (a, b) {
        return a === b;
      },
    },
  })
);
app.set("view engine", "handlebars");

// NOTA: por defecto Express busca vistas en el directorio <cwd>/views, lo cual falla porque
// nuestras plantillas están en src/views/. Con esta línea le decimos la ruta correcta.
app.set("views", join(__dirname, "views"));

// ===== 4. MIDDLEWARE =====
app.use(express.json());

// NOTA: express.static('public') permite servir archivos públicos (CSS, imágenes, etc.)
// accediendo a rutas como /css/styles.css → public/css/styles.css
app.use(express.static('public'));

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
// Redirige desde / al panel principal de vistas web
app.get("/", (req, res) => {
  res.redirect("/views");
});

// ===== 5. RUTAS DE SERVICIOS =====
// NOTA: todo lo que antes eran app.get/post/put/delete("/api/services...") ahora vive en
// services.router.js. Acá solo se "engancha" ese router bajo el prefijo /api/services.
// Por eso adentro del router las rutas están escritas como "/" y "/:sid", sin repetir el
// prefijo: Express se lo antepone automáticamente.
app.use("/api/services", servicesRouter);

// ===== 6. RUTAS DE RESERVAS =====
app.use("/api/bookings", bookingsRouter);

// ===== 7. RUTAS DE VISTAS (HTML con Handlebars) =====
// NOTA: se monta en "/" porque las rutas del router ya incluyen el prefijo "/views".
// Es la última app.use antes del 404 para que las vistas tengan prioridad sobre JSON.
app.use("/", viewsRouter);

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
