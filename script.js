// script.js - Dulce Reto Repostero
// Parte 1, datos del juego

// variables y datos primitivis
// const guarda valores que no cambian
const vidas_iniciales = 3;
const puntos_por_acierto = 2;
const jugadas_para_intercambio = 4; // Regla B: cada cuántos aciertos se intercambian casillas



// arreglos y objetos literales
// Arreglo de recetas, cada receta es un objeto.
// Cada receta tiene dos arreglos de objetos: ingredientes (correctos) y distractores.
const recetas = [
  {
    nombre: "Torta de chocolate", tipo: "Horneado",
    ingredientes: [
      { nombre: "Harina", emoji: "🌾" },
      { nombre: "Huevos", emoji: "🥚" },
      { nombre: "Chocolate", emoji: "🍫" },
      { nombre: "Mantequilla", emoji: "🧈" },
      { nombre: "Azúcar", emoji: "🍬" }
    ],
    distractores: [
      { nombre: "Sal", emoji: "🧂" },
      { nombre: "Queso", emoji: "🧀" }
    ]
  },

  {
    nombre: "Helado de fresa", tipo: "Postre frío",
    ingredientes: [
      { nombre: "Leche", emoji: "🥛" },
      { nombre: "Fresa", emoji: "🍓" },
      { nombre: "Azúcar", emoji: "🍬" },
      { nombre: "Crema de leche", emoji: "🥣" },
      { nombre: "Vainilla", emoji: "🌼" }
    ],
    distractores: [
      { nombre: "Harina", emoji: "🌾" },
      { nombre: "Café", emoji: "☕" }
    ]
  },

  {
    nombre: "Limonada de coco", tipo: "Bebida",
    ingredientes: [
      { nombre: "Limón", emoji: "🍋" },
      { nombre: "Agua", emoji: "💧" },
      { nombre: "Hielo", emoji: "🧊" },
      { nombre: "Coco", emoji: "🥥" },
      { nombre: "Azúcar", emoji: "🍬" }
    ],
    distractores: [
      { nombre: "Chocolate", emoji: "🍫" },
      { nombre: "Sal", emoji: "🧂" }
    ]
  }
];


// Objeto literal, el ingrediente trampa (Regla C).
// Tiene apariencia de ingrediente normal para que no se note a simple vista.
// esTrampa es un boolean (true/false) que nos dirá si la casilla es la trampa.
const trampa = { nombre: "Ají picante", emoji: "🌶️", esTrampa: true };


// Objeto de estado
// Aquí vive todo lo que cambia mientras se juega
// Se usa let porque estos datos van a cambiar como los turnos, los puntos, etc


let estado = {
  recetaActual: 0,       // posición de la receta dentro del arreglo recetas
  jugadorActivo: 0,      // 0 = Jugadora 1, 1 = Jugadora 2
  jugadasExitosas: 0,    // cuántos aciertos van (para la Regla B)
  congelado: false,      // true cuando se activa la Regla C
  jugadoraCongelada: null, // posición de la jugadora que perderá su turno
  terminado: false,      // true cuando el juego se acaba
  tablero: [],           // las 8 casillas de la ronda (se llena en armarTablero)
  jugadoras: [
    { nombre: "Jugador 1", puntos: 0, vidas: vidas_iniciales, taza: [] },
    { nombre: "Jugador 2", puntos: 0, vidas: vidas_iniciales, taza: [] }
  ]
};


// parte 2: DOM
const elTablero = document.getElementById("tablero");
const elMensaje = document.getElementById("mensaje");
const elNombreReceta = document.getElementById("nombre-receta");
const elFaltantes = document.getElementById("faltantes");
const elLetrero = document.getElementById("letrero");
const elLetreroTitulo = document.getElementById("letrero-titulo");
const elLetreroTexto = document.getElementById("letrero-texto");
const elBtnLetrero = document.getElementById("btn-letrero");
let accionLetrero = null;


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


// Regla B, intercambia dos casillas al azar del arreglo lógico
// Solo intercambia casillas que aún no han sido reveladas
const intercambiarCasillas = () => {
  const ocultas = estado.tablero
    .map((casilla, indice) => ({ casilla, indice }))
    .filter(({ casilla }) => !casilla.revelada);

  // Si hay menos de 2 ocultas no hay nada que intercambiar
  if (ocultas.length < 2) return;

  const posA = Math.floor(Math.random() * ocultas.length);
  let posB = Math.floor(Math.random() * ocultas.length);
  while (posB === posA) {
    posB = Math.floor(Math.random() * ocultas.length);
  }

  const ia = ocultas[posA].indice;
  const ib = ocultas[posB].indice;
  const temporal = estado.tablero[ia];
  estado.tablero[ia] = estado.tablero[ib];
  estado.tablero[ib] = temporal;
};

//Recoge los nombres que las jugadoras escribieron en la página de inicio 
// y los pone en los datos. Si dejaron el campo vacío,
//  se quedan “Jugador 1” y “Jugador 2”

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


//Dibujar el tablero
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
  const siguiente = estado.jugadorActivo === 0 ? 1 : 0;

  if (estado.congelado && estado.jugadoraCongelada === siguiente) {
    estado.congelado = false;
    estado.jugadoraCongelada = null;
    return estado.jugadoras[siguiente];
  }

  estado.jugadorActivo = siguiente;
  return null;
}


//Pone o quita la clase de congelado del body
function actualizarFondo() {
  if (estado.congelado) {
    document.body.classList.add("congelado");
  } else {
    document.body.classList.remove("congelado");
  }
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
  let aviso = null;

  casilla.revelada = true;
  casilla.resultado = resultado;

  if (resultado === "correcto") {
    jugadora.puntos += puntos_por_acierto;
    jugadora.taza.push(casilla.ingrediente);
    estado.jugadasExitosas++;
    mensaje = jugadora.nombre + " acertó con " + casilla.ingrediente.nombre + ".";

    // Regla B: letrero cuando se intercambian dos casillas
    if (estado.jugadasExitosas % jugadas_para_intercambio === 0) {
      intercambiarCasillas();
      aviso = {
        titulo: "¡Cambio en el tablero!",
        texto: "Dos casillas se intercambiaron de lugar. ¡Ojo con dónde estaba cada ingrediente!"
      };
    }

  } else if (resultado === "distractor") {
    jugadora.vidas--;
    mensaje = jugadora.nombre + " falló: " + casilla.ingrediente.nombre + " no va en la receta.";
  } else {
    estado.congelado = true;
    estado.jugadoraCongelada = estado.jugadorActivo;
    mensaje = "¡" + casilla.ingrediente.nombre + " era la trampa! " + jugadora.nombre + " perderá su siguiente turno.";
    aviso = {
      titulo: "¡Era la trampa!",
      texto: jugadora.nombre + " eligió " + casilla.ingrediente.nombre + " y perderá su siguiente turno."
    };

  }

  if (jugadora.vidas === 0) {
    terminarJuego();
    return;
  }

  if (resultado === "correcto" && recetaCompleta()) {
    if (estado.recetaActual < recetas.length - 1) {
      pasarARecetaSiguiente();
      // Letrero de receta nueva (reemplaza al de intercambio si coinciden)
      aviso = {
        titulo: "¡Receta completa!",
        texto: "Ahora toca: " + recetas[estado.recetaActual].nombre + ". Las tazas se vacían y el tablero cambia."
      };
    } else {
      terminarJuego();
      return;
    }
  }

  const saltada = pasarTurno();
  if (saltada) {
    mensaje += " " + saltada.nombre + " pierde su turno por la trampa.";
  }

  dibujarTablero();
  actualizarMarcador();
  dibujarTazas();
  actualizarReceta();
  actualizarFondo();
  elMensaje.textContent = mensaje + " Turno de " + estado.jugadoras[estado.jugadorActivo].nombre + ".";


  // Un solo letrero al final, sea cual sea el evento
  if (aviso) {
    mostrarLetrero(aviso.titulo, aviso.texto, "Entendido", null);
  }

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
  // Se limpia el estado de congelado para que no arrastre a la siguiente receta
  estado.congelado = false;
  estado.jugadoraCongelada = null;
  estado.recetaActual++;
  armarTablero();
}

//las funciones del letrero
function mostrarLetrero(titulo, texto, textoBoton, accion) {
  elLetreroTitulo.textContent = titulo;
  elLetreroTexto.textContent = texto;
  elBtnLetrero.textContent = textoBoton;
  accionLetrero = accion;
  elLetrero.classList.remove("oculto");
  elBtnLetrero.focus();
}

function ocultarLetrero() {
  elLetrero.classList.add("oculto");
}


function alPulsarLetrero() {
  ocultarLetrero();
  if (accionLetrero) {
    accionLetrero();
  }
}

//Todas las recetas completadas, se acaba el juego

function terminarJuego() {
  estado.terminado = true;
  estado.congelado = false;
  actualizarFondo();
  dibujarTablero();
  actualizarMarcador();
  dibujarTazas();
  actualizarReceta();

  const j1 = estado.jugadoras[0];
  const j2 = estado.jugadoras[1];
  let titulo = "";
  let detalle = "";

  if (j1.vidas === 0) {
    titulo = "¡Ganó " + j2.nombre + "!";
    detalle = j1.nombre + " se quedó sin vidas.";
  } else if (j2.vidas === 0) {
    titulo = "¡Ganó " + j1.nombre + "!";
    detalle = j2.nombre + " se quedó sin vidas.";
  } else if (j1.puntos > j2.puntos) {
    titulo = "¡Ganó " + j1.nombre + "!";
    detalle = "Terminó con " + j1.puntos + " puntos contra " + j2.puntos + ".";
  } else if (j2.puntos > j1.puntos) {
    titulo = "¡Ganó " + j2.nombre + "!";
    detalle = "Terminó con " + j2.puntos + " puntos contra " + j1.puntos + ".";
  } else {
    titulo = "¡Empate!";
    detalle = "Las dos terminaron con " + j1.puntos + " puntos.";
  }

  elMensaje.textContent = "Juego terminado. " + titulo;
  mostrarLetrero(titulo, detalle, "Jugar de nuevo", reiniciarJuego);
}

//Reiniciar juego, eja todos los datos como
//  al principio y vuelve a dibujar

function reiniciarJuego() {
  ocultarLetrero();
  estado.recetaActual = 0;
  estado.jugadorActivo = 0;
  estado.jugadasExitosas = 0;
  estado.congelado = false;
  estado.jugadoraCongelada = null;
  estado.terminado = false;

  for (const jugadora of estado.jugadoras) {
    jugadora.puntos = 0;
    jugadora.vidas = vidas_iniciales;
    jugadora.taza = [];
  }

  armarTablero();
  dibujarTablero();
  actualizarMarcador();
  dibujarTazas();
  actualizarReceta();
  actualizarFondo();
  elMensaje.textContent = "Turno de " + estado.jugadoras[estado.jugadorActivo].nombre;
}

//botón del letrero
elBtnLetrero.addEventListener("click", alPulsarLetrero);
//Para conecar el botón reiniciar, sino no hace nada
document.getElementById("btn-reiniciar").addEventListener("click", reiniciarJuego);

//El arranque
//Deja todo listo llamando a lo anterior en el orden correcto,
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
