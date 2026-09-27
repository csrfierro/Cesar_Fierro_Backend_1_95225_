import app from "./app.js";
import { config } from "./config/env.config.js";

// NOTA: separar el arranque de la configuración de la app es lo que permite, por ejemplo,
// testear "app" con supertest sin levantar un puerto real.
app.listen(config.port, () => {
  console.log(
    `Servidor escuchando en http://localhost:${config.port} (${config.nodeEnv})`,
  );
});
