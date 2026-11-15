// ===== 1. IMPORTACIONES =====
import { Server } from "socket.io";
import { getSocketEvents } from "./handlers/notifications.handler.js";

// ===== 2. INSTANCIA GLOBAL DE SOCKET.IO =====
let io = null;

/**
 * Inicializa Socket.io y lo conecta al servidor HTTP.
 * @param {import('http').Server} httpServer - Servidor HTTP de Express para montar Socket.io
 * @returns {Server} Instancia configurada de Socket.io
 */
const initSocketIO = (httpServer) => {
  // Crear la instancia de Socket.io con CORS para permitir conexiones desde cualquier origen (frontend)
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN || "http://localhost:8080",
      methods: ["GET", "POST"],
    },
  });

  // ===== 3. CONEXIONES Y ROOMS (EVENTOS BASE) =====
  io.on("connection", (socket) => {
    console.log(`[Socket.io] Cliente conectado: ${socket.id}`);

    // Eventos base de conexión/sala
    socket.on("join-booking-room", (status) => {
      socket.join(status);
      console.log(
        `[Socket.io] Cliente ${socket.id} se unió a la sala: ${status}`
      );
    });

    socket.on("join-booking-id", (id) => {
      socket.join(`booking-${id}`);
      console.log(
        `[Socket.io] Cliente ${socket.id} se unió a la sala: booking-${id}`
      );
    });

    socket.on("subscribe-to-booking", (id) => {
      const room = `booking-${id}`;
      socket.join(room);
      socket.to(room).emit("notification", {
        type: "info",
        message: `Estás siguiendo la actualización de esta reserva.`,
      });
    });

    socket.on("ping", () => {
      socket.emit("pong");
    });

    socket.on("disconnect", (reason) => {
      console.log(`[Socket.io] Cliente ${socket.id} desconectado: ${reason}`);
    });

    // ===== 4. EVENTOS POR DOMINIO (registrados por handlers externos) =====
    const domainEvents = getSocketEvents(socket, io);
    for (const [event, handler] of Object.entries(domainEvents)) {
      socket.on(event, handler);
    }

    console.log(`[Socket.io] Handlers de dominio registrados para ${socket.id}`);
  });

  console.log("[Socket.io] Servidor de WebSockets inicializado correctamente.");
  return io;
};

/**
 * Obtiene la instancia global de Socket.io (para emitir eventos desde los services).
 */
export const getIO = () => {
  if (!io) throw new Error("Socket.io no está inicializado. Llama a initSocketIO primero.");
  return io;
};

export default initSocketIO;