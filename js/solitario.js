/***** INICIO DECLARACIÓN DE VARIABLES GLOBALES *****/

// Array de palos
let palos = ["viu", "cua", "hex", "cir"];
// Array de número de cartas (permite cambiar entre subconjuntos y baraja completa)
let numeros = [9, 10, 11, 12];

// paso (top y left) en pixeles de una carta a la siguiente en un mazo
let paso = 5;

// Tapetes				
let tapeteInicial   = document.getElementById("inicial");
let tapeteSobrantes = document.getElementById("sobrantes");
let tapeteReceptor1 = document.getElementById("receptor1");
let tapeteReceptor2 = document.getElementById("receptor2");
let tapeteReceptor3 = document.getElementById("receptor3");
let tapeteReceptor4 = document.getElementById("receptor4");

// Mazos
let mazoInicial   = [];
let mazoSobrantes = [];
let mazoReceptor1 = [];
let mazoReceptor2 = [];
let mazoReceptor3 = [];
let mazoReceptor4 = [];

// Contadores de cartas
let contInicial     = document.getElementById("contador_inicial");
let contSobrantes   = document.getElementById("contador_sobrantes");
let contReceptor1   = document.getElementById("contador_receptor1");
let contReceptor2   = document.getElementById("contador_receptor2");
let contReceptor3   = document.getElementById("contador_receptor3");
let contReceptor4   = document.getElementById("contador_receptor4");
let contMovimientos = document.getElementById("contador_movimientos");

// Tiempo
let contTiempo  = document.getElementById("contador_tiempo"); // span cuenta tiempo
let segundos     = 0;    // cuenta de segundos
let temporizador = null; // manejador del temporizador

/***** FIN DECLARACIÓN DE VARIABLES GLOBALES *****/

/**
 * Inicializa el juego creando la baraja, cargando las cartas en el tapete inicial, 
 * reiniciando los contadores y arrancando el temporizador.
 */
function comenzarJuego() {
    // Crear baraja
    for (let palo of palos) {
        for (let numero of numeros) {
            let carta = document.createElement("img");
            carta.src = `imagenes/baraja/${numero}-${palo}.png`;
            carta.dataset.palo = palo;
            carta.dataset.numero = numero;
            carta.dataset.color = (palo === "viu" || palo === "cir") ? "naranja" : "gris";
            carta.style.position = "absolute";
            carta.style.top = "0px";
            carta.style.left = "0px";
            carta.draggable = true;

            // Manejar eventos de arrastrar y soltar
            carta.addEventListener("dragstart", onDragStart);
            carta.addEventListener("dragend", onDragEnd);

            mazoInicial.push(carta);
        }
    }

    // Barajar las cartas
    barajar(mazoInicial);

    // Colocar el mazo barajado en el tapete inicial
    cargarTapeteInicial(mazoInicial);

    // Reiniciar contadores
    setContador(contInicial, mazoInicial.length);
    setContador(contSobrantes, 0);
    setContador(contReceptor1, 0);
    setContador(contReceptor2, 0);
    setContador(contReceptor3, 0);
    setContador(contReceptor4, 0);
    setContador(contMovimientos, 0);

    // Iniciar temporizador
    arrancarTiempo();

    // Configurar receptores de cartas
    configurarReceptores();
}

/**
 * Configura los tapetes como zonas de recepción de cartas.
 */
function configurarReceptores() {
    [tapeteInicial, tapeteSobrantes, tapeteReceptor1, tapeteReceptor2, tapeteReceptor3, tapeteReceptor4].forEach(tapete => {
        tapete.addEventListener("dragover", onDragOver);
        tapete.addEventListener("drop", onDrop);
    });
}

/**
 * Maneja el evento de inicio de arrastre.
 * @param {DragEvent} event - Evento de arrastre.
 */
function onDragStart(event) {
    event.dataTransfer.setData("text/plain", event.target.dataset.numero);
    event.dataTransfer.setData("palo", event.target.dataset.palo);
    event.dataTransfer.setData("color", event.target.dataset.color);
    event.target.classList.add("dragging");
}

/**
 * Maneja el evento de fin de arrastre.
 * @param {DragEvent} event - Evento de fin de arrastre.
 */
function onDragEnd(event) {
    event.target.classList.remove("dragging");
}

/**
 * Permite el arrastre sobre un tapete.
 * @param {DragEvent} event - Evento de arrastre.
 */
function onDragOver(event) {
    event.preventDefault();
}

/**
 * Maneja el evento de soltar una carta sobre un tapete.
 * @param {DragEvent} event - Evento de soltar.
 */
function onDrop(event) {
    event.preventDefault();
    const numero = event.dataTransfer.getData("text/plain");
    const palo = event.dataTransfer.getData("palo");
    const color = event.dataTransfer.getData("color");
    const carta = Array.from(document.querySelectorAll("img")).find(
        c => c.dataset.numero === numero && c.dataset.palo === palo
    );

    if (carta && event.target.classList.contains("tapete")) {
        // Validar reglas del juego
        if (esMovimientoValido(carta, event.target)) {
            // Mover carta al nuevo tapete
            event.target.appendChild(carta);
            incContador(contMovimientos); // Incrementar movimientos
            actualizarContadores();
            verificarFinDelJuego();
        }
    }
}

/**
 * Verifica si un movimiento es válido según las reglas del juego.
 * @param {HTMLElement} carta - La carta que se intenta mover.
 * @param {HTMLElement} tapete - El tapete destino.
 * @returns {boolean} - True si el movimiento es válido, false en caso contrario.
 */
function esMovimientoValido(carta, tapete) {
    if (tapete === tapeteInicial || tapete === tapeteSobrantes) return true;
    const mazo = obtenerMazoDesdeTapete(tapete);
    const ultimaCarta = mazo[mazo.length - 1];
    if (!ultimaCarta) return carta.dataset.numero === "12"; // Primera carta debe ser 12
    return (
        parseInt(ultimaCarta.dataset.numero) - 1 === parseInt(carta.dataset.numero) &&
        ultimaCarta.dataset.color !== carta.dataset.color
    );
}

/**
 * Obtiene el mazo correspondiente a un tapete.
 * @param {HTMLElement} tapete - El tapete de origen.
 * @returns {Array} - El mazo correspondiente.
 */
function obtenerMazoDesdeTapete(tapete) {
    if (tapete === tapeteReceptor1) return mazoReceptor1;
    if (tapete === tapeteReceptor2) return mazoReceptor2;
    if (tapete === tapeteReceptor3) return mazoReceptor3;
    if (tapete === tapeteReceptor4) return mazoReceptor4;
    return [];
}

/**
 * Verifica si el juego ha finalizado.
 */
function verificarFinDelJuego() {
    if (mazoInicial.length === 0 && mazoSobrantes.length === 0) {
        clearInterval(temporizador);
        alert(`¡Fin del juego! Tiempo: ${contTiempo.textContent}, Movimientos: ${contMovimientos.textContent}`);
    } else if (mazoInicial.length === 0) {
        // Rebarajar cartas del tapete de sobrantes
        mazoInicial = [...mazoSobrantes];
        mazoSobrantes = [];
        barajar(mazoInicial);
        cargarTapeteInicial(mazoInicial);
        actualizarContadores();
    }
}

/**
 * Actualiza los contadores de los tapetes.
 */
function actualizarContadores() {
    setContador(contInicial, mazoInicial.length);
    setContador(contSobrantes, mazoSobrantes.length);
    setContador(contReceptor1, mazoReceptor1.length);
    setContador(contReceptor2, mazoReceptor2.length);
    setContador(contReceptor3, mazoReceptor3.length);
    setContador(contReceptor4, mazoReceptor4.length);
}

/**
 * Arranca el temporizador que muestra el tiempo transcurrido en formato hh:mm:ss.
 * Resetea el temporizador si ya existe uno en ejecución.
 */
function arrancarTiempo() {
    if (temporizador) clearInterval(temporizador);
    segundos = 0;

    function actualizarTiempo() {
        let seg = segundos % 60;
        let min = Math.floor(segundos / 60) % 60;
        let hor = Math.floor(segundos / 3600);
        contTiempo.textContent = `${hor.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}:${seg.toString().padStart(2, "0")}`;
        segundos++;
    }

    actualizarTiempo(); // Primera visualización 00:00:00
    temporizador = setInterval(actualizarTiempo, 1000);
}

/**
 * Baraja un array de cartas en orden aleatorio usando el algoritmo de Fisher-Yates.
 * @param {Array} mazo - Array de elementos <img> que representan las cartas a barajar.
 */
function barajar(mazo) {
    for (let i = mazo.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        [mazo[i], mazo[j]] = [mazo[j], mazo[i]];
    }
}

/**
 * Coloca las cartas del mazo inicial en el tapete inicial y ajusta su posición.
 * @param {Array} mazo - Array de elementos <img> que representan las cartas.
 */
function cargarTapeteInicial(mazo) {
    tapeteInicial.innerHTML = ""; // Limpiar el tapete inicial
    mazo.forEach((carta, index) => {
        carta.style.top = `${index * paso}px`;
        carta.style.left = `${index * paso}px`;
        tapeteInicial.appendChild(carta);
    });
}

/**
 * Incrementa el valor mostrado en un contador.
 * @param {HTMLElement} contador - Elemento HTML que actúa como contador.
 */
function incContador(contador) {
    contador.textContent = parseInt(contador.textContent) + 1;
}

/**
 * Decrementa el valor mostrado en un contador.
 * @param {HTMLElement} contador - Elemento HTML que actúa como contador.
 */
function decContador(contador) {
    contador.textContent = parseInt(contador.textContent) - 1;
}

/**
 * Establece el valor mostrado en un contador.
 * @param {HTMLElement} contador - Elemento HTML que actúa como contador.
 * @param {number} valor - Valor a establecer en el contador.
 */
function setContador(contador, valor) {
    contador.textContent = valor;
}

// Evento para reiniciar el juego cuando se presiona el botón de reset
document.getElementById("reset").addEventListener("click", comenzarJuego);

// Arrancar el juego automáticamente al cargar la página
window.onload = comenzarJuego;
