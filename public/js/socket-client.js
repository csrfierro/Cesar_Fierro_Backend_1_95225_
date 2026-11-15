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

  let statusBadge = "";
  if (booking.status === "pendiente") {
    statusBadge = '<span class="badge badge-warning">Pendiente</span>';
  } else if (booking.status === "confirmada") {
    statusBadge = '<span class="badge badge-success">Confirmada</span>';
  } else if (booking.status === "cancelada") {
    statusBadge = '<span class="badge badge-danger">Cancelada</span>';
  } else {
    statusBadge = `<span class="badge">${booking.status}</span>`;
  }

  newRow.innerHTML = `
    <td>${booking._id}</td>
    <td><strong>${booking.clientName}</strong></td>
    <td>${booking.clientEmail}</td>
    <td>${booking.date}</td>
    <td>${booking.time}</td>
    <td>${statusBadge}</td>
    <td><a href="/views/booking/${booking._id}" class="btn btn-primary">Ver detalle</a></td>
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
 * Actualiza el badge de estado en la página de detalle de reserva (/views/booking/:id).
 */
function updateBookingDetailPage(data) {
  const badge = document.getElementById("booking-status-badge");
  if (!badge) return;

  const status = data.status || data.newStatus;
  let badgeClass = "";
  let label = status;

  if (status === "pendiente") {
    badgeClass = "badge-warning";
    label = "Pendiente";
  } else if (status === "confirmada") {
    badgeClass = "badge-success";
    label = "Confirmada";
  } else if (status === "cancelada") {
    badgeClass = "badge-danger";
    label = "Cancelada";
  }

  badge.className = `badge ${badgeClass}`;
  badge.textContent = label;

  badge.style.transition = "opacity 0.3s ease-out, transform 0.3s ease-out";
  badge.style.opacity = "0.5";
  badge.style.transform = "scale(0.95)";
  setTimeout(() => {
    badge.style.opacity = "1";
    badge.style.transform = "scale(1)";
  }, 300);

  if (data.oldStatus && data.newStatus) {
    showToast(
      `Reserva actualizada: ${data.oldStatus} -> ${data.newStatus}`,
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
/**
 * Actualiza la página de detalle de reserva cuando se elimina (redirige a lista).
 */
function deleteBookingDetailPage(data) {
  const bookingId = data.bookingId || data._id;
  
  // Verificar si estamos viendo esta reserva específica en el detail-page
  const currentPath = window.location.pathname;
  if (currentPath.includes(`/views/booking/${bookingId}`)) {
    showToast(`Reserva de ${data.clientName} eliminada`, "error");
    
    // Redirigir a la lista después de un breve retraso
    setTimeout(() => {
      window.location.href = "/views/bookings";
    }, 1500);
  }
}

/**
 * Agrega una nueva fila de servicio a la tabla en /views.
 */
function addServiceRow(service) {
  const tbody = document.querySelector("#services-table tbody");
  if (!tbody) return;

  const newRow = document.createElement("tr");
  newRow.setAttribute("data-service-id", service._id);
  newRow.style.animation = "fadeIn 0.5s ease-in-out";
  newRow.style.backgroundColor = "#e8f5e9";

  const statusBadge = service.available
    ? '<span class="badge badge-success">Sí</span>'
    : '<span class="badge badge-danger">No</span>';

  newRow.innerHTML = `
    <td>${service._id}</td>
    <td><strong>${service.name}</strong></td>
    <td>${service.category}</td>
    <td>${service.duration}</td>
    <td>$${service.price}</td>
    <td>${statusBadge}</td>
    <td><a href="/views/services/${service._id}" class="btn btn-primary">Ver detalle</a></td>
  `;

  tbody.insertBefore(newRow, tbody.firstChild);

  setTimeout(() => {
    newRow.style.backgroundColor = "transparent";
    newRow.style.transition = "background-color 1s ease-in-out";
  }, 2000);

  showToast(`Nuevo servicio "${service.name}" agregado`, "success");
}

/**
 * Actualiza una fila existente de la tabla segun el estado actualizado.
 */
function updateServiceRow(service) {
  const row = document.querySelector(`tr[data-service-id="${service._id}"]`);
  if (!row) return;

  const statusBadge = service.available
    ? '<span class="badge badge-success">Sí</span>'
    : '<span class="badge badge-danger">No</span>';

  row.children[0].textContent = service._id;
  row.children[1].innerHTML = `<strong>${service.name}</strong>`;
  row.children[2].textContent = service.category;
  row.children[3].textContent = service.duration;
  row.children[4].textContent = `$${service.price}`;
  row.children[5].innerHTML = statusBadge;
  row.children[6].innerHTML = `<a href="/views/services/${service._id}" class="btn btn-primary">Ver detalle</a>`;

  row.style.transition = "background-color 0.5s";
  row.style.backgroundColor = "#fff3cd";
  setTimeout(() => {
    row.style.backgroundColor = "transparent";
  }, 1500);

  showToast(`Servicio "${service.name}" actualizado`, "info");
}

/**
 * Elimina una fila de la tabla por servicio ID.
 */
function deleteServiceRow(service) {
  const row = document.querySelector(`tr[data-service-id="${service._id}"]`);
  if (!row) return;

  row.style.transition = "opacity 0.5s ease-out, transform 0.5s ease-out";
  row.style.opacity = "0";
  row.style.transform = "translateX(-20px)";

  setTimeout(() => {
    row.remove();
    showToast(`Servicio "${service.name}" eliminado`, "error");
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

  if (isOnBookingsList) {
    updateBookingRow(data);
  } else if (isOnBookingDetail) {
    // Si estamos en la página de detalle, actualizar el badge de estado
    updateBookingDetailPage(data);
  } else {
    showToast(`Reserva de ${data.clientName} actualizada`, "info");
  }
});

/**
 * Evento: reserva eliminada.
 */
socket.on("booking-deleted", (data) => {
  const isOnBookingsList = window.location.pathname.includes("/views/bookings");
  const bookingId = data.bookingId || data._id;
  const isOnBookingDetail = window.location.pathname.includes(`/views/booking/${bookingId}`);

  if (isOnBookingsList) {
    deleteBookingRow(data);
  } else if (isOnBookingDetail) {
    // Si estamos viendo esta reserva en el detail-page, redirigir a la lista
    deleteBookingDetailPage(data);
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
    const bookingId = data.bookingId || data._id;
    const isOnBookingDetail = window.location.pathname.includes(`/views/booking/${bookingId}`);
    if (isOnBookingDetail) {
      updateBookingDetailPage({ status: data.newStatus, oldStatus: data.oldStatus, newStatus: data.newStatus });
    } else {
      updateBookingRow(data);
    }
  }
});

/**
 * Evento: nuevo servicio creado.
 */
socket.on("service-created", (data) => {
  if (window.location.pathname === "/views" || window.location.pathname.includes("/views")) {
    addServiceRow(data);
  } else {
    showToast(`Nuevo servicio "${data.name}" agregado`, "success");
  }
});

/**
 * Evento: servicio actualizado.
 */
socket.on("service-updated", (data) => {
  if (window.location.pathname === "/views" || window.location.pathname.includes("/views")) {
    updateServiceRow(data);
  } else {
    showToast(`Servicio "${data.name}" actualizado`, "info");
  }
});

/**
 * Evento: servicio eliminado.
 */
socket.on("service-deleted", (data) => {
  if (window.location.pathname === "/views" || window.location.pathname.includes("/views")) {
    deleteServiceRow(data);
  } else {
    showToast(`Servicio "${data.name}" eliminado`, "error");
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
