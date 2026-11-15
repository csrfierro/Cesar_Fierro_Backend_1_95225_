import app from "./app.js";
import { envConfig } from "./config/env.config.js";
import { connectDB } from './config/database.config.js';
import http from "http";
import initSocketIO from "./socket/index.js";

const startServer = async () => {
  await connectDB();

  // Crear servidor HTTP que envuelve la app de Express (requerido por Socket.io)
  const httpServer = http.createServer(app);

  // Inicializar Socket.io y conectarlo al mismo servidor HTTP
  initSocketIO(httpServer);

  // Levantar el servidor en el puerto configurado
  httpServer.listen(envConfig.port, () => {
    console.log(
      `Servidor escuchando en http://localhost:${envConfig.port} (${envConfig.nodeEnv})`
    );
    console.log(`Socket.io habilitado en ws://localhost:${envConfig.port}`);
  });
};

startServer();