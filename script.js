function obtenerSemanaISO(fechaStr) {

    const partes = fechaStr.split("/");
    const fechaObj = new Date(partes[2], partes[1] - 1, partes[0]);

    const temp = new Date(fechaObj.getTime());
    temp.setHours(0, 0, 0, 0);
    temp.setDate(temp.getDate() + 3 - (temp.getDay() + 6) % 7);

    const semana1 = new Date(temp.getFullYear(), 0, 4);

    return 1 + Math.round(((temp - semana1) / 86400000 - 3 + (semana1.getDay() + 6) % 7) / 7);
}

const fecha = new Date().toLocaleDateString();
document.getElementById("fechaActual").textContent = fecha;

let datos = JSON.parse(localStorage.getItem("productividad")) || {};

if (!datos[fecha]) {
    datos[fecha] = {
        tickets: [],
        horaInicio: null,
        horaFin: null,
        metaHora: 3
    };
}

function guardarDatos() {
    localStorage.setItem("productividad", JSON.stringify(datos));
}

/* ================= CONFIGURACIÓN ================= */

function guardarConfiguracion() {

    const inicio = document.getElementById("horaInicio").value;
    const fin = document.getElementById("horaFin").value;
    const metaHora = parseInt(document.getElementById("metaHora").value);

    if (!inicio || !fin) {
        alert("Configura horario válido");
        return;
    }

    datos[fecha].horaInicio = inicio;
    datos[fecha].horaFin = fin;
    datos[fecha].metaHora = metaHora;

    guardarDatos();
    actualizarVista();
}

/* ================= REGISTRO ================= */

function agregarAccionable() {

    const input = document.getElementById("ticketInput");
    const mensaje = document.getElementById("mensaje");
    const ticket = input.value.trim();

    if (!/^\d{7,8}$/.test(ticket)) {
        mensaje.textContent = "⚠ Ticket inválido (7-8 dígitos)";
        return;
    }

datos[fecha].tickets.push({
    tipo: "accionable",
    numero: ticket,
    timestamp: new Date().toISOString()
});

    guardarDatos();
    input.value = "";
    mensaje.textContent = "✔ Accionable registrado";

    actualizarVista();
}

function agregarNoAccionable() {

datos[fecha].tickets.push({
    tipo: "no_accionable",
    timestamp: new Date().toISOString()
});

    guardarDatos();

    document.getElementById("mensaje").textContent = "✔ Conversación registrada (0.5)";

    actualizarVista();
}

/* ================= CÁLCULO PRINCIPAL ================= */

function actualizarVista() {

    const inicio = datos[fecha].horaInicio;
    const fin = datos[fecha].horaFin;
    const metaHora = datos[fecha].metaHora || 3;

    let horas = 0;
    let metaDia = 0;

    if (inicio && fin) {

        const [h1, m1] = inicio.split(":").map(Number);
        const [h2, m2] = fin.split(":").map(Number);

        const inicioMin = h1 * 60 + m1;
        const finMin = h2 * 60 + m2;

        if (finMin > inicioMin) {
            horas = (finMin - inicioMin) / 60;
            metaDia = horas * metaHora;
        }
    }

    document.getElementById("horasTrabajadas").textContent = horas.toFixed(2);
    document.getElementById("metaDia").textContent = metaDia.toFixed(0);

    const tickets = datos[fecha].tickets;

    let accionables = 0;
    let noAccionables = 0;

    tickets.forEach(t => {
        if (t.tipo === "accionable") accionables++;
        if (t.tipo === "no_accionable") noAccionables++;
    });

    const avancePonderado = accionables + (noAccionables * 0.5);

    document.getElementById("accionablesHoy").textContent = accionables;
    document.getElementById("noAccionablesHoy").textContent = noAccionables;

    let porcentaje = 0;

    if (metaDia > 0) {
        porcentaje = ((avancePonderado / metaDia) * 100).toFixed(1);
    }

    document.getElementById("avanceTotal").textContent = porcentaje + "%";

    const barra = document.getElementById("barraProgreso");
    barra.style.width = porcentaje + "%";

    // ===== KPI POR HORA (SOLO ACCIONABLES) =====

const ahora = new Date();
const horaActual = ahora.getHours();

let accionablesHoraActual = 0;

tickets.forEach(t => {
    if (t.tipo === "accionable" && t.timestamp) {
        const fechaTicket = new Date(t.timestamp);
        if (fechaTicket.getHours() === horaActual) {
            accionablesHoraActual++;
        }
    }
});

let porcentajeHora = 0;

if (metaHora > 0) {
    porcentajeHora = ((accionablesHoraActual / metaHora) * 100).toFixed(0);
}

document.getElementById("metaActual").textContent = porcentajeHora + "%";

    // Colores dinámicos
    barra.style.backgroundColor =
        porcentaje < 60 ? "#ef4444" :
        porcentaje < 100 ? "#f59e0b" :
        "#22c55e";

    mostrarHistorial();
}

/* ================= HISTORIAL ================= */

function mostrarHistorial() {

    const contenedor = document.getElementById("historial");
    contenedor.innerHTML = "";

    for (let fechaKey in datos) {

        const tickets = datos[fechaKey].tickets;

        let accionables = 0;
        let noAccionables = 0;

        tickets.forEach(t => {
            if (t.tipo === "accionable") accionables++;
            if (t.tipo === "no_accionable") noAccionables++;
        });

        const totalPonderado = accionables + (noAccionables * 0.5);

        const div = document.createElement("div");
        div.innerHTML = `
            <p><strong>${fechaKey}</strong></p>
            <p>Accionables: ${accionables}</p>
            <p>No accionables: ${noAccionables}</p>
            <p>Total ponderado: ${totalPonderado}</p>
        `;

        contenedor.appendChild(div);
    }
}

/* ================= INIT ================= */

function exportarExcel() {

    const inicio = datos[fecha].horaInicio || "";
    const fin = datos[fecha].horaFin || "";
    const metaHora = datos[fecha].metaHora || 0;

    let horas = 0;
    let metaDia = 0;

    if (inicio && fin) {
        const [h1, m1] = inicio.split(":").map(Number);
        const [h2, m2] = fin.split(":").map(Number);
        const inicioMin = h1 * 60 + m1;
        const finMin = h2 * 60 + m2;

        if (finMin > inicioMin) {
            horas = (finMin - inicioMin) / 60;
            metaDia = horas * metaHora;
        }
    }

    const partes = fecha.split("/");
    const dia = partes[0];
    const mes = partes[1];
    const anio = partes[2];

    const fechaObj = new Date(anio, mes - 1, dia);
    const diasSemana = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];
    const nombreDia = diasSemana[fechaObj.getDay()];
    const semanaISO = obtenerSemanaISO(fecha);

    const tickets = datos[fecha].tickets;

    let accionables = 0;
    let noAccionables = 0;

    tickets.forEach(t => {
        if (t.tipo === "accionable") accionables++;
        if (t.tipo === "no_accionable") noAccionables++;
    });

    const totalPonderado = accionables + (noAccionables * 0.5);
    const porcentaje = metaDia > 0 ? ((totalPonderado / metaDia) * 100).toFixed(1) : 0;

    const wb = XLSX.utils.book_new();

    const resumenData = [
        ["REPORTE DE PRODUCTIVIDAD"],
        [],
        ["Fecha", fecha],
        ["Día de la semana", nombreDia],
        ["Semana del año", semanaISO],
        ["Mes", mes],
        ["Año", anio],
        [],
        ["CONFIGURACIÓN"],
        ["Hora Inicio", inicio],
        ["Hora Fin", fin],
        ["Horas Trabajadas", horas.toFixed(2)],
        ["Meta por Hora", metaHora],
        ["Meta del Día", metaDia.toFixed(0)],
        [],
        ["RESULTADO"],
        ["Accionables", accionables],
        ["No Accionables", noAccionables],
        ["Total Ponderado", totalPonderado],
        ["% Avance", porcentaje + "%"]
    ];

    const wsResumen = XLSX.utils.aoa_to_sheet(resumenData);

    wsResumen["A1"].s = {
        font: { bold: true, color: { rgb: "FFFFFF" }, sz: 16 },
        fill: { fgColor: { rgb: "8B0000" } }
    };

    wsResumen["!cols"] = [
        { wch: 25 },
        { wch: 25 }
    ];

    XLSX.utils.book_append_sheet(wb, wsResumen, "Resumen");

    // DETALLE
    const detalleData = [
        ["DETALLE DE ACTIVIDADES"],
        [],
        ["Tipo", "Ticket", "Valor"]
    ];

    tickets.forEach(t => {
        if (t.tipo === "accionable") {
            detalleData.push(["Accionable", t.numero, 1]);
        } else {
            detalleData.push(["No Accionable", "", 0.5]);
        }
    });

    const wsDetalle = XLSX.utils.aoa_to_sheet(detalleData);

    wsDetalle["A1"].s = {
        font: { bold: true, color: { rgb: "FFFFFF" }, sz: 14 },
        fill: { fgColor: { rgb: "8B0000" } }
    };

    wsDetalle["!cols"] = [
        { wch: 20 },
        { wch: 20 },
        { wch: 10 }
    ];

    XLSX.utils.book_append_sheet(wb, wsDetalle, "Detalle");

    XLSX.writeFile(wb, `Productividad_${fecha.replace(/\//g, "-")}.xlsx`);
}

/* ================= SELECTOR DE DÍAS ================= */

function cargarSelectorDias() {

    const selector = document.getElementById("selectorDia");

    if (!selector) return;

    selector.innerHTML = "";

    const claves = Object.keys(datos);

    if (claves.length === 0) {
        const option = document.createElement("option");
        option.textContent = "Sin registros";
        selector.appendChild(option);
        return;
    }

    claves.forEach(fechaKey => {
        const option = document.createElement("option");
        option.value = fechaKey;
        option.textContent = fechaKey;
        selector.appendChild(option);
    });
}

function eliminarDia() {

    const selector = document.getElementById("selectorDia");
    const diaSeleccionado = selector.value;

    if (!diaSeleccionado) return;

    const confirmacion = confirm("¿Seguro que quieres eliminar el día " + diaSeleccionado + "?");

    if (!confirmacion) return;

    delete datos[diaSeleccionado];

    guardarDatos();
    location.reload();
}

actualizarVista();
cargarSelectorDias();

setInterval(() => {
    actualizarVista();
}, 60000);