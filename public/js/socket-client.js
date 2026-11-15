// ===== Cliente Socket.io para actualizaciones en tiempo real =====

const socket = io();

/**
 * Formatea una fecha ISO o string YYYY-MM-DD a formato legible.
 */
function formatDate(dateStr) {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

/**
 * Obtiene el badge HTML para un estado de reserva.
 */
function getStatusBadge(status) {
  const badges = {
    pendiente: '<span class="badge bg-warning">Pendiente</span>',
    confirmada: '<span class="badge bg-success">Confirmada</span>',
    cancelada: '<span class="badge bg-danger">Cancelada</span>',
  };
  return badges[status] || `<span class="badge bg-secondary">${status}</span>`;
}

/**
 * Muestra una notificación tipo toast en la parte superior de la página.
 */
function showToast(message, type = "info") {
  let toastContainer = document.getElementById("toast-container");
  if (!toastContainer) {
    toastContainer = document.createElement("div");
    toastContainer.id = "toast-container";
    toastContainer.style.cssText =
      "position: fixed; top: 20px; right: 20px; z-index: 9999; display: flex; flex-direction: column; gap: 10px;";
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement("div");
  const bgColors = { info: "#0d6efd", success: "#198754", warning: "#ffc107", error: "#dc3545" };
  const textColors = { info: "#fff", success: "#fff", warning: "#000", error: "#fff" };

  toast.style.cssText = `
    background: ${bgColors[type] || bgColors.info};
    color: ${textColors[type] || textColors.info};
    padding: 12px 24px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    font-family: 'Poppins', sans-serif;
    font-size: 14px;
    animation: slideIn 0.3s ease-out;
    max-width: 350px;
    word-break: break-word;
  `;
  toast.textContent = message;
  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.transition = "opacity 0.3s ease-out";
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

/**
 * Agrega una nueva fila de reserva a la tabla en /views/bookings.
 */
function addBookingRow(booking) {
  const tbody = document.querySelector("#bookings-table tbody");
  if (!tbody) return;

  const newRow = document.createElement("tr");
  newRow.setAttribute("data-booking-id", booking._id);
  newRow.style.animation = "fadeIn 0.5s ease-in-out";
  newRow.style.backgroundColor = "#e8f5e9";

  newRow.innerHTML = `
    <td>${booking.clientName}</td>
    <td>${booking.clientEmail}</td>
    <td>${formatDate(booking.date)}</td>
    <td>${booking.time}</td>
    <td>${getStatusBadge(booking.status)}</td>
    <td>${formatDate(booking.createdAt)}</td>
  `;

  tbody.insertBefore(newRow, tbody.firstChild);

  setTimeout(() => {
    newRow.style.backgroundColor = "transparent";
    newRow.style.transition = "background-color 1s ease-in-out";
  }, 2000);

  showToast(`Nueva reserva de ${booking.clientName} para el ${formatDate(booking.date)}`, "success");
}

/**
 * Actualiza una fila existente en la tabla segun el estado actualizado.
 */
function updateBookingRow(data) {
  const row = document.querySelector(`tr[data-booking-id="${data._id}"]`);
  if (!row) return;

  const statusCell = row.children[4];
  if (statusCell) {
    statusCell.innerHTML = getStatusBadge(data.status || data.newStatus);
  }

  if (data.date) row.children[2].textContent = formatDate(data.date);
  if (data.time) row.children[3].textContent = data.time;

  row.style.backgroundColor = "#fff3cd";
  setTimeout(() => {
    row.style.transition = "background-color 1s ease-in-out";
    row.style.backgroundColor = "transparent";
  }, 1500);

  if (data.oldStatus && data.newStatus) {
    showToast(
      `Reserva de ${data.clientName} actualizada: ${data.oldStatus} -> ${data.newStatus}`,
      "info"
    );
  }
}

/**
 * Elimina una fila de la tabla por booking ID.
 */
function deleteBookingRow(data) {
  const row = document.querySelector(`tr[data-booking-id="${data.bookingId || data._id}"]`);
  if (!row) return;

  row.style.transition = "opacity 0.5s ease-out, transform 0.5s ease-out";
  row.style.opacity = "0";
  row.style.transform = "translateX(20px)";

  setTimeout(() => {
    row.remove();
    showToast(`Reserva de ${data.clientName} eliminada`, "error");
  }, 500);
}

// ===== Escuchar eventos del servidor Socket.io =====

/**
 * Evento: notificacion generica del servidor.
 */
socket.on("notification", (data) => {
  showToast(`Notificacion: ${data.message}`, data.type === "error" ? "error" : "info");
});

/**
 * Evento: nueva reserva creada.
 */
socket.on("booking-created", (data) => {
  if (window.location.pathname.includes("/views/bookings")) {
    addBookingRow(data);
  } else {
    showToast(`Nueva reserva de ${data.clientName}`, "success");
  }
});

/**
 * Evento: reserva actualizada.
 */
socket.on("booking-updated", (data) => {
  const isOnBookingsList = window.location.pathname.includes("/views/bookings");
  const isOnBookingDetail = window.location.pathname.includes(`/views/booking/${data._id}`);

  if (isOnBookingsList || isOnBookingDetail) {
    updateBookingRow(data);
  } else {
    showToast(`Reserva de ${data.clientName} actualizada`, "info");
  }
});

/**
 * Evento: reserva eliminada.
 */
socket.on("booking-deleted", (data) => {
  const isOnBookingsList = window.location.pathname.includes("/views/bookings");
  const isOnBookingDetail = window.location.pathname.includes(`/views/booking/${data.bookingId}`);

  if (isOnBookingsList || isOnBookingDetail) {
    deleteBookingRow(data);
  } else {
    showToast(`Reserva de ${data.clientName} eliminada`, "error");
  }
});

/**
 * Evento: nueva reserva informacional (sala por estado).
 */
socket.on("new-booking", (data) => {
  if (window.location.pathname.includes("/views/bookings")) {
    addBookingRow(data);
  } else {
    showToast(
      `Nueva reserva de ${data.clientName} para el ${formatDate(data.date)} a las ${data.time}`,
      "success"
    );
  }
});

/**
 * Evento: cambio en booking (rooms por ID).
 */
socket.on("booking-changed", (data) => {
  if (data.type === "created") {
    addBookingRow(data);
  } else {
    updateBookingRow(data);
  }
});

// ===== Animaciones CSS dinamicas para toasts y filas =====

if (!document.getElementById("socket-client-styles")) {
  const style = document.createElement("style");
  style.id = "socket-client-styles";
  style.textContent = `
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    #toast-container {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
  `;
  document.head.appendChild(style);
}

console.log("[Socket.io] Cliente conectado. Esperando eventos del servidor...");
