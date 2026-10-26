import app from "./app.js";
import { envConfig } from "./config/env.config.js";
import { connectDB } from './config/database.config.js';


const startServer = async () => {
 await connectDB();

 // NOTA: separar el arranque de la configuración de la app es lo que permite, por ejemplo,
// testear "app" con supertest sin levantar un puerto real.
app.listen(envConfig.port, () => {
  console.log(
    `Servidor escuchando en http://localhost:${envConfig.port} (${envConfig.nodeEnv})`,
  );
});
};

startServer();