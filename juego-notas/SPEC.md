# Spec: juego-notas

## Objetivo

Un juego web para que alumnos de ESO practiquen la **lectura de notas en clave de sol**. Debe enganchar más que `pentagramapro` y `desafio-notas`, gracias a los puntos, los niveles y el sonido.

Se abre con un enlace, sin instalar nada y sin registrarse. Al empezar se elige uno de dos modos:

| Modo | Dónde | Quién |
|---|---|---|
| **Individual** | Móvil o PC, en casa | Un alumno, con su propio récord |
| **Pizarra** | Pizarra digital, en clase | Dos equipos a la vez, con la pantalla dividida |

### Historias de usuario

1. **Como alumno**, abro el enlace en el móvil, elijo "Individual" y un nivel, y respondo notas pulsando su nombre. Gano puntos y desbloqueo el siguiente nivel.
2. **Como alumno**, al volver otro día veo mi récord y los niveles que ya había desbloqueado.
3. **Como profesor**, abro el enlace en la pizarra, elijo "Pizarra", un nivel y el número de rondas. Dos alumnos (uno por equipo) compiten a la vez y gana el punto quien acierta antes.
4. **Como profesor del programa bilingüe**, cambio los nombres de las notas a inglés (C, D, E…).

### Niveles

| Nivel | Notas que salen | Tiempo por nota |
|---|---|---|
| 1. Líneas | Mi4, Sol4, Si4, Re5, Fa5 | 10 s |
| 2. Espacios | Fa4, La4, Do5, Mi5 | 10 s |
| 3. Pentagrama completo | Mi4 a Fa5 (las 9 notas) | 7 s |
| 4. Líneas adicionales | Do4 a Do6 (todas, incluidas las de fuera del pentagrama) | 5 s |

- Nunca sale la misma nota dos veces seguidas.
- Se responde solo el **nombre** de la nota, sin la octava. Hay 7 botones: Do Re Mi Fa Sol La Si, o C D E F G A B en inglés.

### Puntuación

- Acierto: **+10 puntos**, más **+1 por cada segundo** que sobre.
- Fallo o tiempo agotado: 0 puntos.
- **Modo individual:** una partida son **20 notas**. Con **15 o más aciertos** se desbloquea el nivel siguiente. El nivel 1 está siempre desbloqueado.

### Sonido

- Cuando aparece una nota, **suena su altura real**: por ejemplo, La4 suena a 440 Hz.
- **Acierto:** sonido corto y agradable. **Fallo** (o tiempo agotado): sonido distinto, más grave. Los dos se distinguen claramente.
- Un botón de **silencio** visible en todas las pantallas.

### Modo pizarra

- Se configura el nivel (1–4) y el número de rondas (5, 10 o 15; por defecto 10).
- La pantalla se divide en dos mitades, izquierda **Equipo Rojo** y derecha **Equipo Azul**. Cada mitad tiene su pentagrama y sus 7 botones, y la nota es **la misma en las dos**.
- El primer equipo que acierta gana la ronda.
- Si un equipo falla, **queda bloqueado** en esa ronda y el otro puede seguir intentándolo. Así se evita pulsar botones al azar.
- Si los dos fallan o se agota el tiempo, nadie suma.
- Los dos equipos pueden tocar a la vez sin interferirse (multitáctil).
- Al final se muestran el ganador y el marcador, con un botón para la revancha.

### Pantallas

1. **Inicio:** botones "Individual" y "Pizarra", selector de idioma de notas (ES/EN) y botón de silencio.
2. **Individual:** selector de niveles (bloqueados con candado) con el récord de cada uno → partida → resultado (puntos, aciertos, récord nuevo, nivel desbloqueado).
3. **Pizarra:** configuración (nivel y rondas) → partida en pantalla dividida → resultado.

## Stack técnico

- **HTML, CSS y JavaScript** sin framework, sin paso de compilación y **sin dependencias**.
- **Pentagrama:** dibujado con SVG generado desde JavaScript (5 líneas, clave de sol, cabeza de nota y líneas adicionales cuando hacen falta).
- **Sonido:** Web Audio API del navegador. La nota usa un oscilador a su frecuencia real; acierto y fallo, tonos sintetizados distintos. No hay archivos de audio.
- **Guardado:** `localStorage` del navegador (récord por nivel, niveles desbloqueados, idioma y silencio).
- **Tests:** `node:test` (incluido en Node 22), sin instalar nada.
- **Navegadores:** Chrome, Edge y Safari actuales, de escritorio y de móvil.

## Comandos

```bash
# Tests (desde la raíz del repo)
node --test juego-notas/tests/

# Probar en local: servir la carpeta y abrir http://localhost:8000
python3 -m http.server 8000 -d juego-notas
```

Los módulos ES no funcionan abriendo `index.html` con doble clic. Hace falta servirlo, en local o en la web.

## Estructura del proyecto

```
juego-notas/
  SPEC.md          → Este documento
  index.html       → Única página; contiene las pantallas
  styles.css       → Estilos (móvil vertical y pizarra horizontal)
  src/
    notes.js       → Notas, niveles, nombres ES/EN, frecuencias, generar nota al azar (lógica pura)
    scoring.js     → Puntos, aciertos, desbloqueo de niveles (lógica pura)
    duel.js        → Reglas de una ronda del modo pizarra (lógica pura)
    staff.js       → Dibuja una nota en el pentagrama SVG
    audio.js       → Sonido de la nota, de acierto y de fallo
    storage.js     → Lee y guarda récords y preferencias
    app.js         → Pantallas, eventos y temporizador; une todo lo anterior
  tests/
    notes.test.js
    scoring.test.js
    duel.test.js
```

La lógica pura (`notes`, `scoring`, `duel`) no toca el DOM ni el audio, para poder probarla con `node --test`.

## Estilo de código

- Módulos ES con `export` con nombre, funciones pequeñas y nada de clases salvo que hagan falta.
- Nombres de variables y funciones en inglés; textos visibles en español.
- Sin comentarios obvios: solo los que expliquen el porqué.

```js
// notes.js
export const LEVELS = {
  1: { notes: ['E4', 'G4', 'B4', 'D5', 'F5'], seconds: 10 },
  2: { notes: ['F4', 'A4', 'C5', 'E5'], seconds: 10 },
  // ...
};

const NAMES = {
  es: { C: 'Do', D: 'Re', E: 'Mi', F: 'Fa', G: 'Sol', A: 'La', B: 'Si' },
  en: { C: 'C', D: 'D', E: 'E', F: 'F', G: 'G', A: 'A', B: 'B' },
};

export function noteName(note, lang) {
  return NAMES[lang][note[0]];
}

export function randomNote(level, previous, random = Math.random) {
  const pool = LEVELS[level].notes.filter((n) => n !== previous);
  return pool[Math.floor(random() * pool.length)];
}
```

## Estrategia de tests

- **Unitarios (`node --test`)** para toda la lógica pura:
  - `notes`: notas de cada nivel, nombres ES/EN, frecuencias (La4 = 440 Hz, Do4 ≈ 261,63 Hz), que no se repita la nota anterior y posición en el pentagrama (cuántas líneas adicionales necesita cada nota).
  - `scoring`: puntos con y sin tiempo sobrante, desbloqueo con 15/20 y sin él con 14/20, récord nuevo frente a récord no superado.
  - `duel`: gana el primero que acierta, un equipo que falla queda bloqueado, si fallan los dos nadie suma, con el tiempo agotado nadie suma, y el marcador final.
- **Comprobación manual** de lo visual y lo sonoro, en el navegador y con capturas. Lista mínima:
  - Cada nivel dibuja bien sus notas, incluidas las líneas adicionales.
  - Suenan la nota, el acierto y el fallo, y el silencio funciona.
  - En el móvil (vertical) todo cabe sin desplazar la pantalla.
  - En la pizarra (horizontal, 16:9) dos toques simultáneos en mitades distintas se registran los dos.

## Límites

- **Siempre:**
  - Ejecutar `node --test juego-notas/tests/` antes de cada commit.
  - Mantener la lógica pura separada del DOM.
  - Botones grandes y fáciles de pulsar, con buen contraste.
  - Que el juego funcione con el sonido bloqueado o en silencio.
- **Preguntar antes:**
  - Añadir cualquier dependencia o paso de compilación.
  - Cambiar niveles, tiempos o puntuación respecto a esta spec.
  - Publicar el juego en Internet o cambiar la visibilidad del repo.
- **Nunca:**
  - Pedir datos personales o registro.
  - Enviar datos a ningún servidor.
  - Usar archivos de audio o imágenes con derechos dudosos.
  - Tocar otras carpetas del repo.

## Criterios de éxito

1. Al abrir la página se elige el modo Individual o Pizarra.
2. **Individual:** se puede jugar una partida de 20 notas en cualquier nivel desbloqueado; con 15 aciertos se desbloquea el siguiente; el récord y el desbloqueo siguen ahí al recargar.
3. **Pizarra:** una partida de 10 rondas entre dos equipos funciona de principio a fin con toques simultáneos y muestra el ganador.
4. Las 4 tablas de notas de los niveles coinciden con esta spec y se dibujan en su sitio correcto.
5. Suena la altura de cada nota, y acierto y fallo tienen sonidos distintos.
6. El idioma ES/EN cambia los botones y se recuerda.
7. Funciona en el móvil (vertical) y en una pantalla 16:9 sin desplazar la pantalla.
8. Todos los tests pasan.

## Preguntas abiertas

1. **Publicación:** `pruebas-claude-code` es privado, y GitHub Pages en un repo privado necesita GitHub Pro. Para que los alumnos tengan un enlace habrá que hacer público este repo o mover el juego a un repo público propio. No hace falta decidirlo hasta terminar.
2. **¿Niveles bloqueados en el modo individual?** La spec propone desbloquearlos con 15/20 aciertos. La alternativa es dejarlos todos libres.
3. **Idioma de la interfaz:** solo cambia a inglés el nombre de las notas; el resto de textos queda en español.
