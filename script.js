// juego.js - Dulce Reto Repostero
// PARTE 1: DATOS DEL JUEGO

// ----- 1. VARIABLES Y TIPOS PRIMITIVOS -----
// const guarda valores que no cambian
const vidas_iniciales = 3;
const puntos_por_acierto = 2;
const jugadas_para_intercambio = 4; // Regla B: cada cuántos aciertos se intercambian casillas



// ----- 2. ARREGLOS Y OBJETOS LITERALES -----
// Arreglo de recetas: cada receta es un objeto.
// Cada receta tiene dos arreglos de objetos: ingredientes (correctos) y distractores.
const recetas = [ 
    {nombre: "Torta de chocolate", tipo: "Horneado", 
    ingredientes: [
      { nombre: "Harina", emoji: "🌾" },
      { nombre: "Huevos", emoji: "🥚" },
      { nombre: "Chocolate", emoji: "🍫" },
      { nombre: "Mantequilla", emoji: "🧈" }
    ],
     distractores: [
      { nombre: "Sal", emoji: "🧂" },
      { nombre: "Limón", emoji: "🍋" },
      { nombre: "Queso", emoji: "🧀" }
    ]},

    {nombre: "Helado de fresa", tipo: "Postre frío", 
    ingredientes: [
      { nombre: "Leche", emoji: "🥛" },
      { nombre: "Fresa", emoji: "🍓" },
      { nombre: "Azúcar", emoji: "🍬" },
      { nombre: "Crema de leche", emoji: "🥣" }
    ],
     distractores: [
      { nombre: "Harina", emoji: "🌾" },
      { nombre: "Mantequilla", emoji: "🧈" },
      { nombre: "Café", emoji: "☕" }
    ]},

      {nombre: "Limonada de coco", tipo: "Bebida", 
    ingredientes: [
      { nombre: "Limón", emoji: "🍋" },
      { nombre: "Agua", emoji: "💧" },
      { nombre: "Hielo", emoji: "🧊" },
      { nombre: "Coco", emoji: "🥥" }
    ],
     distractores: [
      { nombre: "Chocolate", emoji: "🍫" },
      { nombre: "Huevos", emoji: "🥚" },
      { nombre: "Sal", emoji: "🧂" }
    ]}
];


// Objeto literal: el ingrediente trampa (Regla C).
// Tiene apariencia de ingrediente normal para que no se note a simple vista.
// esTrampa es un boolean (true/false) que nos dirá si la casilla es la trampa.
const trampa = { nombre: "Ají picante", emoji: "🌶️", esTrampa: true };


// ----- 3. OBJETO DE ESTADO -----
// Aquí vive todo lo que cambia mientras se juega.
// Se usa let porque estos datos van a cambiar (los puntos, el turno, etc.).


let estado = {
  recetaActual: 0,       // posición de la receta dentro del arreglo recetas
  jugadorActivo: 0,      // 0 = Jugadora 1, 1 = Jugadora 2
  jugadasExitosas: 0,    // cuántos aciertos van (para la Regla B)
  congelado: false,      // true cuando se activa la Regla C
  terminado: false,      // true cuando el juego se acaba
  tablero: [],           // las 8 casillas de la ronda (se llena en armarTablero)
  jugadoras: [
    { nombre: "Jugadora 1", puntos: 0, vidas: vidas_iniciales, taza: [] },
    { nombre: "Jugadora 2", puntos: 0, vidas: vidas_iniciales, taza: [] }
  ]
};


// PARTE 2: PANTALLA (DOM)
const elTablero = document.getElementById("tablero");
const elMensaje = document.getElementById("mensaje");
const elNombreReceta = document.getElementById("nombre-receta");
const elFaltantes = document.getElementById("faltantes");


//Desordena una lista al azar, hace que el tablero sea distinto 
// en cada partida y que la trampa nunca esté en el mismo lugar

const mezclar = (arreglo) => {
  for (let i = arreglo.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temporal = arreglo[i];
    arreglo[i] = arreglo[j];
    arreglo[j] = temporal;
  }
  return arreglo;
};

//Recoge los nombres que las jugadoras escribieron en la página de inicio 
// y los pone en los datos. Si dejaron el campo vacío,
//  se quedan “Jugadora 1” y “Jugadora 2”

function leerNombres() {
  const parametros = new URLSearchParams(window.location.search);
  const nombre1 = parametros.get("j1");
  const nombre2 = parametros.get("j2");

  if (nombre1 && nombre1.trim() !== "") {
    estado.jugadoras[0].nombre = nombre1.trim();
  }
  if (nombre2 && nombre2.trim() !== "") {
    estado.jugadoras[1].nombre = nombre2.trim();
  }
}

//Armar el tablero
//Decide qué ingredientes hay en la ronda y en qué orden
// Trabaja solo con datos, sin tocar la pantalla
function armarTablero() {
  const receta = recetas[estado.recetaActual];

  const ingredientesRonda = receta.ingredientes.concat(receta.distractores, [trampa]);
  mezclar(ingredientesRonda);

  estado.tablero = [];
  for (const ingrediente of ingredientesRonda) {
    estado.tablero.push({ ingrediente: ingrediente, revelada: false });
  }
}


//Pieza 5: dibujar el tablero
//toma los datos del tablero y crea los botones en la pantalla

function dibujarTablero() {
  elTablero.replaceChildren();

  for (let i = 0; i < estado.tablero.length; i++) {
    const casilla = estado.tablero[i];

    const boton = document.createElement("button");
    boton.type = "button";
    boton.classList.add("casilla");
    boton.dataset.posicion = i;

    if (casilla.revelada) {
      boton.textContent = casilla.ingrediente.emoji;
      boton.setAttribute("aria-label", casilla.ingrediente.nombre);
       boton.classList.add(casilla.resultado);
    } else {
      boton.textContent = "?";
      boton.classList.add("oculta");
      boton.setAttribute("aria-label", "Casilla oculta");
    }

    boton.addEventListener("click", () => manejarClic(i));
    elTablero.appendChild(boton);
  }
}

//Actualizar el marcador
//muestra en pantalla los nombres, los puntos y las vidas
// y marca con borde menta a quien tiene el turno.
function actualizarMarcador() {
  for (let i = 0; i < estado.jugadoras.length; i++) {
    const jugadora = estado.jugadoras[i];
    const numero = i + 1;

    document.getElementById("nombrej" + numero).textContent = jugadora.nombre;
    document.getElementById("puntosj" + numero).textContent = jugadora.puntos;

    document.getElementById("vidasj" + numero).textContent =
      jugadora.vidas > 0 ? "♥ ".repeat(jugadora.vidas).trim() : "Sin vidas";

    const panel = document.getElementById("panelj" + numero);
    const etiqueta = document.getElementById("etiquetaj" + numero);

    if (i === estado.jugadorActivo) {
      panel.classList.add("activa");
      etiqueta.textContent = "Tu turno";
    } else {
      panel.classList.remove("activa");
      etiqueta.textContent = "En espera";
    }
  }
}


//la receta
//escribe el nombre de la receta actual y la lista de ingredientes 
// que hay que conseguir.

function actualizarReceta() {
  const receta = recetas[estado.recetaActual];

  const faltantes = [];
  for (const ingrediente of receta.ingredientes) {
    if (!estaConseguido(ingrediente)) {
      faltantes.push(ingrediente.nombre);
    }
  }

  elNombreReceta.textContent = receta.nombre;
  elFaltantes.textContent = faltantes.length > 0
    ? "Faltan: " + faltantes.join(", ")
    : "¡Receta completa!";
}


//Dibujar las tazas, pone el emoji de cada ingredientes qque la jugadora ya consiguió

function dibujarTazas() {
  const receta = recetas[estado.recetaActual];

  for (let i = 0; i < estado.jugadoras.length; i++) {
    const jugadora = estado.jugadoras[i];
    const contenedor = document.getElementById("tazaj" + (i + 1));

    contenedor.replaceChildren();

    for (let e = 0; e < receta.ingredientes.length; e++) {
      const espacio = document.createElement("div");
      espacio.classList.add("espacio");

      if (e < jugadora.taza.length) {
        espacio.textContent = jugadora.taza[e].emoji;
        espacio.classList.add("lleno");
      }

      contenedor.appendChild(espacio);
    }
  }
}


//clasificar lo que salió

function clasificar(ingrediente) {
  if (ingrediente.esTrampa) {
    return "trampa";
  }

  const receta = recetas[estado.recetaActual];
  for (const correcto of receta.ingredientes) {
    if (correcto.nombre === ingrediente.nombre) {
      return "correcto";
    }
  }

  return "distractor";
}


//Decidir qué sigue faltando

function estaConseguido(ingrediente) {
  for (const jugadora of estado.jugadoras) {
    for (const conseguido of jugadora.taza) {
      if (conseguido.nombre === ingrediente.nombre) {
        return true;
      }
    }
  }
  return false;
}


//pasar el turno
function pasarTurno() {
  estado.jugadorActivo = estado.jugadorActivo === 0 ? 1 : 0;
}

//el clic
//Es lo que hace que el juego reaccione

function manejarClic(posicion) {
  const casilla = estado.tablero[posicion];

  if (estado.terminado || casilla.revelada) {
    return;
  }

  const jugadora = estado.jugadoras[estado.jugadorActivo];
  const resultado = clasificar(casilla.ingrediente);
  let mensaje = "";

  casilla.revelada = true;
  casilla.resultado = resultado;

  if (resultado === "correcto") {
    jugadora.puntos += puntos_por_acierto;
    jugadora.taza.push(casilla.ingrediente);
    estado.jugadasExitosas++;
    mensaje = jugadora.nombre + " acertó con " + casilla.ingrediente.nombre + ".";
  } else if (resultado === "distractor") {
    jugadora.vidas--;
    mensaje = jugadora.nombre + " falló: " + casilla.ingrediente.nombre + " no va en la receta.";
  } else {
    mensaje = "¡" + casilla.ingrediente.nombre + " era la trampa!";
  }

  if (resultado === "correcto" && recetaCompleta()) {
    if (estado.recetaActual < recetas.length - 1) {
      pasarARecetaSiguiente();
      mensaje += " ¡Receta completa! Ahora toca: " + recetas[estado.recetaActual].nombre + ".";
    } else {
      terminarJuego();
      return;
    }
  }

  pasarTurno();
  dibujarTablero();
  actualizarMarcador();
  dibujarTazas();
  actualizarReceta();
  elMensaje.textContent = mensaje + " Turno de " + estado.jugadoras[estado.jugadorActivo].nombre + ".";
}


//Cuando se consiguen todos los ingredientes de una receta
function recetaCompleta() {
  const receta = recetas[estado.recetaActual];

  for (const ingrediente of receta.ingredientes) {
    if (!estaConseguido(ingrediente)) {
      return false;
    }
  }
  return true;
}


//Pasa a la siguiente receta
function pasarARecetaSiguiente() {
  for (const jugadora of estado.jugadoras) {
    jugadora.taza = [];
  }
  estado.recetaActual++;
  armarTablero();
}

//Todas las recetas completadas, se acaba el juego

function terminarJuego() {
  estado.terminado = true;
  dibujarTablero();
  actualizarMarcador();
  dibujarTazas();
  actualizarReceta();

  const j1 = estado.jugadoras[0];
  const j2 = estado.jugadoras[1];
  let resultadoFinal = "";

  if (j1.puntos > j2.puntos) {
    resultadoFinal = "¡Ganó " + j1.nombre + " con " + j1.puntos + " puntos!";
  } else if (j2.puntos > j1.puntos) {
    resultadoFinal = "¡Ganó " + j2.nombre + " con " + j2.puntos + " puntos!";
  } else {
    resultadoFinal = "¡Empate con " + j1.puntos + " puntos cada una!";
  }

  elMensaje.textContent = "Juego terminado. " + resultadoFinal;
}

//El arranque
//Deja todo listo llamando alo anterior en el orden correcto,
// e inicia al abrir la página

function iniciarJuego() {
  leerNombres();
  armarTablero();
  dibujarTablero();
  actualizarMarcador();
  dibujarTazas();
  actualizarReceta();
  elMensaje.textContent = "Turno de " + estado.jugadoras[estado.jugadorActivo].nombre;
}

iniciarJuego();
