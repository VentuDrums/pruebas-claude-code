# Plan: Acordes con las manos

Sinte de acompañamiento que se toca con gestos delante de la webcam. Proyecto para el máster de IA aplicada a la educación, abierto a cualquiera que quiera usarlo.

Estado: **en planificación**. No se programa nada nuevo hasta cerrar este documento.

## 1. Objetivo y público

- Cualquier persona puede usarla desde un enlace, sin instalar nada (publicada en GitHub Pages).
- Se presenta como proyecto en el máster. Punto clave: la IA (MediaPipe) se ejecuta en el navegador y el vídeo no sale del ordenador.
- Tecnología de reconocimiento: **MediaPipe Hand Landmarker** (21 puntos por mano). Teachable Machine queda para otro proyecto.

## 2. Pantallas

1. **Pantalla de inicio**
   - Elegir el idioma: español o inglés.
   - Explicación breve y botón «Empezar». Ese clic también sirve para permitir el audio y la cámara.
2. **Pantalla de tocar**
   - Imagen de la cámara en espejo con la detección de las manos dibujada (izquierda y derecha en colores distintos).
   - El acorde que suena:
     - Modo escala: nombre y grado (por ejemplo, «Rem · ii»).
     - Modo personalizado: solo el nombre.
   - Botón para abrir la configuración.
3. **Panel de configuración (desplegable)**: todos los ajustes de los apartados 4 a 8.

## 3. Gestos

Se reconocen con reglas sobre los puntos de la mano (qué dedos están estirados), sin entrenar ningún modelo.

| Gesto | Mano izquierda, modo escala | Mano derecha |
|---|---|---|
| ✊ Puño | Silencio | Nada (pendiente de decidir) |
| ☝️ 1 dedo | I | Configurable |
| ✌️ 2 dedos | II | Configurable |
| 3 dedos (índice, corazón, anular) | III | Configurable |
| 4 dedos (pulgar dentro) | IV | Configurable |
| 🖐️ Mano abierta | V | Configurable |
| 🤙 Pulgar + meñique | VI | Configurable |
| 🤘 Índice + meñique | VII | Configurable |
| 👍 Pulgar | Sin asignar | Configurable |

- **Estabilidad:** un gesto solo cuenta cuando se mantiene unos instantes, para evitar parpadeos.
- **Mano izquierda fuera de cámara:** cuenta como puño (deja de sonar), con un margen de unos 0,3 s para que no corte si MediaPipe pierde la mano un momento.
- **Mano derecha fuera de cámara:** no cambia nada.
- **Mano izquierda y derecha:** se distinguen por su posición en la imagen. Habrá un ajuste por si salen al revés.

## 4. Mano izquierda: elige el acorde

El modo se elige en la configuración.

- **Modo escala**
  - Tónica, escala (mayor, menores natural, armónica y melódica, y los modos) y tríadas o cuatriadas.
  - Cada gesto toca su grado, del I al VII.
- **Modo personalizado**
  - Para cada gesto (incluido 👍) se elige la nota y el tipo de acorde.
  - Un botón rellena la tabla con los acordes de la escala, como punto de partida.

## 5. Mano derecha: cómo suena

El modo se elige en la configuración. En cada modo, el valor que no controla la mano se fija en la configuración.

- **Modo inversión:** cada gesto elige estado fundamental, 1ª, 2ª o 3ª inversión, posición abierta u octava grave o aguda. Ajuste extra: el bajo sigue la inversión, sí o no.
- **Modo ritmo/acompañamiento:** cada gesto elige un patrón, por ejemplo bloque sostenido, negras, rasgueo pop, arpegios, bajo Alberti, vals, contratiempo o bossa.
- La tabla gesto → inversión o gesto → patrón se puede editar.

## 6. Tiempo y cambio de acorde

- **Tempo:** se ajusta a mano en la app.
- **Compás:** se elige en un selector. Propuesta: 2/4, 3/4, 4/4 y 6/8.
- **Momento del cambio de acorde:** al instante, en el siguiente pulso o en el siguiente compás.
- **Al cambiar de acorde dentro de un patrón:** se elige entre seguir a tempo con el acorde nuevo o reiniciar el patrón.
- **Metrónomo:**
  - Encender y apagar el click, con volumen propio.
  - Acento en la primera parte del compás.
  - Cuenta previa opcional.

## 7. Sonido

- **Instrumentos iniciales:** piano, pad y pluck.
- El código se organiza para añadir instrumentos nuevos fácilmente.
- Volumen general.

## 8. Salida MIDI (para FL Studio en Windows)

- Envía exactamente lo que sonaría en la app (acorde y bajo) para que lo toque un instrumento del DAW.
- Al activar el MIDI se puede silenciar el sonido de la app.
- Se elige el puerto MIDI de salida y el canal.
- Al parar o hacer el puño se envían los «note off» de todas las notas, para que no se queden notas colgadas.
- El tempo se ajusta a mano en los dos sitios. Sincronizar con el reloj MIDI del DAW queda para más adelante.
- **Requisitos que la app explicará:**
  - Navegador Chrome o Edge.
  - En Windows hay que instalar **loopMIDI** (gratis) y crear un puerto.
  - En FL Studio, en Options → MIDI settings, hay que activar ese puerto como entrada.

## 9. Idioma y notación

- La interfaz va en español e inglés. El idioma se elige en la pantalla de inicio y se puede cambiar desde la configuración.
- Nombres de las notas: Do-Re-Mi o C-D-E, a elegir.
- Los ajustes se guardan en el navegador.

## 10. Decisiones abiertas

- [ ] **Puño de la mano derecha:** de momento no hace nada.
- [ ] **Patrones y compás:** cada patrón está pensado para un compás. Propuesta: cada patrón se define para los compases en los que tiene sentido, y la tabla solo muestra los patrones compatibles con el compás elegido.
- [ ] **Lista definitiva de patrones** para cada compás.
- [ ] **Código ya escrito en la rama:** reutilizar partes (teoría musical, detección de dedos) o empezar de cero.

## 11. Fases de desarrollo

Cada fase termina con algo que se puede probar y enseñar.

1. **Núcleo**
   - Pantalla de tocar con la cámara y las manos dibujadas.
   - La mano izquierda toca los grados de Do mayor con un pad.
   - Cambio de acorde al instante.
2. **Mano izquierda completa:** modo escala con todos sus ajustes, modo personalizado y panel de configuración.
3. **Mano derecha:** modos inversión y ritmo, con la tabla editable.
4. **Tiempo:** compases, cuantización, metrónomo y cuenta previa.
5. **Sonidos:** piano, pad y pluck.
6. **MIDI:** salida a FL Studio a través de loopMIDI.
7. **Idiomas y pantalla de inicio:** español e inglés, y elección de notación.
8. **Publicación:** GitHub Pages, prueba con usuarios reales y material para el máster.

## 12. Cómo se comprueba

- **Tests automáticos** de la parte musical (acordes, escalas, inversiones, patrones) y de la clasificación de gestos.
- **Prueba con manos reales en cada fase:** la app muestra qué dedos detecta para poder ajustar el reconocimiento.
- **Prueba del MIDI** en FL Studio con loopMIDI.
