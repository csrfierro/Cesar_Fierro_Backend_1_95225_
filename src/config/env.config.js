import dotenv from 'dotenv';

dotenv.config();
//prueba
const requiredVars = ['PORT', 'NODE_ENV'];

const missingVars = requiredVars.filter((name) => !process.env[name]);

if (missingVars.length > 0) {
    console.error(
        `Error de configuracion: faltan las variables de entorno requeridas: ${missingVars.join(', ')}`
    );
    console.error('Crea un archivo .env tomando como base .env.example');
    process.exit(1);
}

export const config = {
    port: Number(process.env.PORT),
    nodeEnv: process.env.NODE_ENV
};
