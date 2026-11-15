// ===== 1. HANDLERS DE NOTIFICACIONES PARA RESERVAS =====

/**
 * Registra los handlers de eventos por dominio en un socket específico.
 * @param {import('socket.io').Socket} socket - Instancia del socket conectado
 * @param {import('socket.io').Server} io - Instancia global de Socket.io (para emitir)
 * @returns {Record<string, Function>} Mapa de event → handler
 */
export const getSocketEvents = (socket, io) => ({
  // ===== Evento: Nueva reserva creada =====
  "booking-created": (data) => {
    console.log(
      `[Socket.io] [booking-created] Emitido para sala: ${data.status || "pendiente"}`
    );

    // Enviar a todos los que siguen la sala por estado (ej. admin ve todas las pendientes)
    io.to(data.status || "pendiente").emit("new-booking", {
      bookingId: data._id,
      clientName: data.clientName,
      date: data.date,
      time: data.time,
      status: data.status || "pendiente",
      createdAt: data.createdAt,
    });

    // También emitir al ID específico de la reserva
    io.to(`booking-${data._id}`).emit("booking-changed", {
      type: "created",
      bookingId: data._id,
      clientName: data.clientName,
      status: data.status || "pendiente",
      date: data.date,
      time: data.time,
    });

    // Notificación global informativa
    io.emit("notification", {
      type: "info",
      message: `Nueva reserva de ${data.clientName} para el ${data.date}.`,
    });
  },

  // ===== Evento: Estado de reserva actualizado =====
  "booking-updated": (data) => {
    const oldStatus = data.oldStatus || "pendiente";
    const newStatus = data.newStatus;
    console.log(
      `[Socket.io] [booking-updated] ${data._id} | ${oldStatus} → ${newStatus}`
    );

    // Emitir a la sala del nuevo estado (para admins filtrando por status)
    io.to(newStatus).emit("booking-status-changed", {
      bookingId: data._id,
      clientName: data.clientName,
      clientEmail: data.clientEmail,
      date: data.date,
      time: data.time,
      status: newStatus,
      updatedAt: data.updatedAt || Date.now(),
    });

    // Emitir también desde la sala del estado anterior (limpieza)
    if (oldStatus !== newStatus) {
      io.to(oldStatus).emit("booking-left-status", {
        bookingId: data._id,
        clientName: data.clientName,
        status: oldStatus,
      });
    }

    // Emitir a la sala individual de la reserva
    io.to(`booking-${data._id}`).emit("booking-changed", {
      type: "updated",
      bookingId: data._id,
      oldStatus,
      newStatus,
      clientName: data.clientName,
      status: newStatus,
      date: data.date,
      time: data.time,
      updatedAt: data.updatedAt || Date.now(),
    });

    // Notificación al cliente asociado (si sigue la reserva)
    io.to(`booking-${data._id}`).emit("notification", {
      type: newStatus === "cancelada" ? "danger" : "success",
      message: `Tu reserva ha sido ${newStatus}.`,
    });
  },

  // ===== Evento: Reserva eliminada =====
  "booking-deleted": (data) => {
    console.log(
      `[Socket.io] [booking-deleted] Reserva eliminada: ${data.bookingId}`
    );

    // Emitir a todas las salas donde estaba
    const oldStatus = data.oldStatus || "pendiente";
    io.to(oldStatus).emit("booking-removed", {
      bookingId: data.bookingId,
      clientName: data.clientName,
    });

    io.emit("notification", {
      type: "warning",
      message: `Reserva de ${data.clientName} eliminada.`,
    });
  },

  // ===== Evento: Cambio de estado (genérico) =====
  "booking-status-change": (data) => {
    const oldStatus = data.oldStatus;
    const newStatus = data.newStatus;

    console.log(
      `[Socket.io] [booking-status-change] ${data.bookingId} | ${oldStatus} → ${newStatus}`
    );

    // Emitir a sala anterior y nueva (como en booking-updated)
    io.to(newStatus).emit("booking-status-changed", {
      bookingId: data.bookingId,
      clientName: data.clientName,
      status: newStatus,
      updatedAt: Date.now(),
    });

    if (oldStatus !== newStatus && oldStatus) {
      io.to(oldStatus).emit("booking-left-status", {
        bookingId: data.bookingId,
        clientName: data.clientName,
        status: oldStatus,
      });
    }

    // Notificación al cliente específico
    io.to(`booking-${data.bookingId}`).emit("notification", {
      type: newStatus === "cancelada" ? "danger" : "success",
      message: `Tu reserva ha sido ${newStatus}.`,
    });
  },
});