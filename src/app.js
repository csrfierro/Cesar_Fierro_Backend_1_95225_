// ===== 1. IMPORTACIONES =====
// Como package.json tiene "type": "module", usamos import/export (ESM)
import express from 'express';                            // librería para crear el servidor
import { config } from './config/env.config.js';          // configuración ya validada (PORT, NODE_ENV)
import ServiceManager from './managers/ServiceManager.js'; // clase que maneja los servicios

// ===== 2. CREACIÓN DE LA APP =====
const app = express();                        // crea la aplicación del servidor
const serviceManager = new ServiceManager();  // crea UN manager que usaremos en las rutas

// ===== 3. MIDDLEWARE =====
// Un middleware se ejecuta ANTES de las rutas, en cada petición.
// express.json() lee el body de las peticiones y lo convierte en objeto (req.body).
// Todavía no lo usamos, pero será necesario para POST y PUT.
app.use(express.json());

// ===== 4. RUTA RAÍZ =====
// app.get(ruta, función) -> "cuando llegue un GET a esta ruta, ejecutá esta función"
// req = lo que pide el cliente | res = lo que le respondemos
app.get('/', (req, res) => {
    res.status(200).json({           // 200 = todo salió bien
        status: 'correcto',
        message: 'API del Sistema de Turnos y Reservas'
    });
});

// ===== 5. RUTA DE SERVICIOS =====
// La función es async porque getServices() lee un archivo y tarda un poco
app.get('/api/services', async (req, res) => {
    try {
        // await: espera a que el manager termine de leer services.json
        const services = await serviceManager.getServices();
        res.status(200).json({
            status: 'correcto',
            payload: services            // "payload" = los datos que devolvemos
        });
    } catch (error) {
        // Si algo falla (archivo ilegible, JSON roto, etc.) caemos acá
        res.status(500).json({           // 500 = error del servidor
            status: 'error',
            message: error.message
        });
    }
});

// ===== 6. ARRANQUE DEL SERVIDOR =====
// listen(puerto, callback) deja el servidor esperando peticiones.
// El callback se ejecuta una sola vez, cuando el servidor ya arrancó.
app.listen(config.port, () => {
    console.log(`Servidor escuchando en http://localhost:${config.port} (${config.nodeEnv})`);
});