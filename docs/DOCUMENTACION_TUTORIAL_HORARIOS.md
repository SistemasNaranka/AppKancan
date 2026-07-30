# Documentación Técnica - Sistema de Tutoriales Guiados (Módulo Horarios)

## 1. Introducción

### 1.1 Propósito de este documento

Este documento describe el sistema de tutoriales guiados (en adelante, *tours*) de la
aplicación AppKancan, con foco en el módulo de Horarios. Está pensado para que un
desarrollador que no conoce el sistema pueda entender cómo funciona un tour, de qué piezas se
compone y, sobre todo, cómo construir uno nuevo. La segunda mitad del documento es una guía de
implementación de los tres tipos de tour que existen en el proyecto.

Un tour es una secuencia de pasos superpuestos a la interfaz real de la aplicación. Cada paso
oscurece la pantalla, resalta un elemento concreto mediante un recuadro luminoso (*spotlight*)
y muestra un globo con una explicación. Su finalidad es enseñar al usuario cómo se usa una
pantalla sin necesidad de un manual externo.

### 1.2 Tecnología base

El sistema completo se apoya en la librería `react-joyride`, que aporta el motor de
renderizado del overlay, el spotlight, el globo y la máquina de eventos que gobierna el avance
entre pasos. El resto de dependencias (Material UI para los componentes visuales de los globos
y de los modales simulados) son las mismas que usa el módulo de Horarios en general. Las
versiones exactas se detallan en la sección 3.

### 1.3 Principio de organización

El aspecto arquitectónico más importante del sistema es que no existe un motor de tours único y
compartido. Cada módulo de la aplicación (horarios, reservas, traslados, curvas,
contabilización, notificaciones) implementa sus propios tours de forma independiente, con su
propio estado y su propia instancia de `Joyride`. Dentro de un mismo módulo puede haber, a su
vez, varios tours separados. Esta decisión responde a que cada pantalla tiene condiciones de
render distintas (roles de usuario, pestañas activas, elementos que aparecen y desaparecen), y
un motor único obligaría a mantener una maraña de condicionales cruzados difícil de sostener.

---

## 2. Estructura de Archivos

### 2.1 Ubicación

Los tours del módulo de Horarios residen en `src/apps/horarios/components/tour/`, con una
excepción relevante: el tour de la vista de Reporte vive embebido dentro de la propia página
que documenta, `src/apps/horarios/pages/ReportePage.tsx`, y no en la carpeta de tours.

```
src/apps/horarios/
├── components/
│   └── tour/
│       ├── HorariosTour.tsx          # Motor del tour de Registros
│       ├── HorariosTourContext.tsx   # Estado del tour de Registros y bloqueo de scroll
│       ├── tourSteps.tsx             # Definición de pasos del tour de Registros
│       ├── AdminTour.tsx             # Tour completo de la pestaña de administración
│       ├── MonitoreoTour.tsx         # Tour de la pestaña de control de horas
│       ├── monitoreoTourSteps.tsx    # Definición de pasos del tour de Monitoreo
│       ├── fakeTourModals.tsx        # Modales simulados de novedad, evento y cronómetro
│       ├── fakeExportModals.tsx      # Modales simulados de las tres exportaciones
│       ├── FakeExportDialog.tsx      # Chasis parametrizable de los modales de exportación
│       ├── FakeHistorialModal.tsx    # Modal simulado usado por el tour de Monitoreo
│       ├── GenericTourModal.tsx      # Chasis genérico reutilizable de modales simulados
│       ├── TourTooltip.tsx           # Globo visual compartido por todos los tours
│       └── TutorialButton.tsx        # Botón disparador del tour de Registros
└── pages/
    └── ReportePage.tsx               # Contiene, embebido, el tour de la vista de Reporte
```

### 2.2 Responsabilidad de cada archivo

Los archivos que terminan en `Tour.tsx` contienen el motor de un tour: el estado, la instancia
de `Joyride` y el manejador de eventos. Los archivos que terminan en `TourSteps.tsx` o
`tourSteps.tsx` contienen únicamente la definición de los pasos, separada del motor para que la
lista de contenidos sea fácil de editar sin tocar la lógica.

Los archivos cuyo nombre empieza por `fake` o `Fake` son modales simulados: réplicas visuales
de modales reales de la aplicación que el tour monta temporalmente para poder explicarlos. No
tienen lógica de negocio ni acceden a datos reales.

`TourTooltip.tsx` exporta el componente visual del globo, `CustomTooltip`, que comparten todos
los tours para mantener una apariencia homogénea. `TutorialButton.tsx` es el botón que dispara
el tour de Registros. `GenericTourModal.tsx` y `FakeExportDialog.tsx` son chasis reutilizables
que estandarizan la estructura de los modales simulados.

---

## 3. Dependencias Tecnológicas

Las siguientes dependencias, tomadas del `package.json` del proyecto, son las que intervienen
en el sistema de tutoriales.

| Librería | Versión | Función dentro del sistema |
| -------- | ------- | -------------------------- |
| `react-joyride` | `^2.9.3` | Motor del tour. Renderiza el overlay, el spotlight y el globo, y emite los eventos de avance. |
| `@types/react-joyride` | `^2.0.2` | Tipos de TypeScript: `Step`, `CallBackProps`, `STATUS`, `EVENTS`, `ACTIONS`. |
| `@mui/material` | `^7.3.4` | Componentes visuales usados en los globos y en los modales simulados. |
| `@mui/icons-material` | `^7.3.4` | Iconografía de los pasos y de los modales simulados. |
| `@mui/system` | `^7.3.6` | Sistema de estilos `sx` de Material UI. |

---

## 4. Anatomía de un Tour

Antes de describir cada tour concreto conviene fijar el vocabulario y las piezas que comparten
todos, porque son las mismas en los tres tipos.

### 4.1 El paso (`Step`)

La unidad mínima de un tour es el paso, un objeto de tipo `Step` de `react-joyride`. Sus
propiedades esenciales son el `target`, que es un selector CSS que identifica el elemento a
resaltar; el `content`, que es el nodo React que se muestra dentro del globo; y el `placement`,
que indica en qué lado del elemento se posiciona el globo.

```typescript
{
  target: '.tour-selector-tienda',
  content: <>Filtra la lista por una tienda específica.</>,
  placement: 'bottom',
  disableBeacon: true,
}
```

El `target` puede ser una clase (`.tour-tabs`), un identificador (`#tour-modal-tipo`) o un
atributo de datos (`[data-tour="reporte-tour-tienda"]`). La condición ineludible es que el
elemento referenciado exista en el DOM en el momento en que el paso se activa. Si no existe, el
motor no encuentra dónde dibujar el spotlight y el tour queda inservible: el overlay aparece sin
recuadro, o el tour no arranca en absoluto. Esta condición es la fuente de la mayoría de fallos
del sistema y se retoma varias veces a lo largo del documento.

### 4.2 El índice de paso controlado

A diferencia del modo automático que ofrece `react-joyride`, todos los tours del proyecto
controlan el paso activo mediante estado de React (`stepIndex`). El motor no decide por su
cuenta cuándo avanzar; se le indica explícitamente qué paso mostrar. Esta elección es
deliberada: permite intervenir entre un paso y el siguiente para, por ejemplo, cambiar de
pestaña o montar un modal antes de que el motor intente posicionar el globo sobre el nuevo
elemento.

### 4.3 El manejador de eventos

Cada tour registra un `callback` que recibe los eventos que emite `react-joyride`. La estructura
del manejador es común: si el evento indica que el tour terminó, se saltó o se cerró
(`STATUS.FINISHED`, `STATUS.SKIPPED`, `ACTIONS.CLOSE`), se apaga el tour y se restablece el
índice; si el evento es de avance o retroceso (`EVENTS.STEP_AFTER` con `ACTIONS.NEXT` o
`ACTIONS.PREV`), se calcula el índice destino y se actualiza el estado.

### 4.4 El globo y los estilos

Todos los tours comparten el componente `CustomTooltip` como globo y la misma configuración de
estilos: color corporativo `#004680`, overlay oscuro a media opacidad y spotlight con borde
azul. Los rótulos de los botones se traducen mediante la propiedad `locale` de `Joyride`
(`Atrás`, `Siguiente`, `Salir del tour`). Reutilizar estas piezas es lo que garantiza que un
tour nuevo se vea igual que los existentes.

---

## 5. Tour de Registros

El tour de la pestaña de Registros es el más complejo del módulo y sirve de referencia para
entender los mecanismos avanzados. A diferencia de los demás, no es una lista lineal única de
pasos, sino una secuencia de fases, donde cada fase corresponde a una pestaña distinta de la
página y tiene su propio conjunto de pasos.

### 5.1 Fases

Las fases están definidas en `HorariosTourContext.tsx` mediante el tipo `TourPhase` y se
recorren en el orden `IDLE`, `REGISTROS`, `NOVEDADES`, `HISTORIAL`, `COMPLETED`. Cada fase
activa se corresponde con una pestaña de la página, según el mapa `PHASE_TAB`, y con un conjunto
de pasos definido en `tourSteps.tsx`. Cuando el usuario termina los pasos de una fase, la
función `nextPhase` cambia la pestaña activa y arranca los pasos de la fase siguiente.

El contexto (`HorariosTourContext.tsx`) es el responsable de conservar el estado del tour
—la fase actual y el índice de paso— y de exponer las funciones `startTour`, `nextPhase` y
`stopTour`. También es el punto donde se aplica el bloqueo de scroll y la anulación del
encabezado fijo durante el tour, temas que se tratan en la sección 8.

### 5.2 Motor

`HorariosTour.tsx` es el motor: monta la instancia de `Joyride`, gestiona el manejador de
eventos y decide cuándo mostrar cada modal simulado. Recibe los pasos de la fase activa desde
`tourSteps.tsx`, agrupados en la estructura `STEPS_BY_PHASE`.

### 5.3 Modales simulados dentro del tour de Registros

Buena parte de los pasos del tour de Registros no señalan elementos reales de la página, sino
modales simulados que el motor monta temporalmente. Su justificación y su mecánica se detallan
en la sección 7, porque constituyen uno de los tres tipos de tour que este documento enseña a
construir.

---

## 6. Tour de Administración y Tour de Monitoreo

### 6.1 Tour de Administración

Definido íntegramente en `AdminTour.tsx`, es un tour autónomo y lineal que documenta la pestaña
de administración de empleados, visible únicamente para el área de Sistemas. Expone su propio
contexto de acceso (`useAdminTour`) y su propio botón disparador (`TutorialAdminButton`), y
declara sus pasos (`ADMIN_STEPS`) dentro del mismo archivo. Recorre el botón de alta de
empleado, el formulario de creación —explicado mediante un modal simulado,
`FakeNuevoEmpleadoModal`—, el selector de tienda, el buscador, los filtros por estado, las
tarjetas de empleado y la paginación.

### 6.2 Tour de Monitoreo

Definido en `MonitoreoTour.tsx`, con sus pasos en `monitoreoTourSteps.tsx`
(`STEPS_CONTROL_HORAS`), documenta la pestaña de control de horas semanales. Se estructura como
un proveedor de contexto, `MonitoreoTourProvider`, que monta la instancia de `Joyride` de forma
permanente y la gobierna mediante una bandera `run`, acompañado del botón
`TutorialMonitoreoButton`.

Este tour tiene una particularidad que condiciona su implementación: no cabe en una sola
pantalla. A mitad del recorrido, el usuario abre una sección de detalle —representada por
`FakeHistorialModal`, que se monta cuando el índice de paso alcanza cierto umbral— y los pasos
siguientes apuntan a elementos de esa sección nueva. Por esta razón, su instancia de `Joyride`
utiliza la opción `disableScrolling`, y no se le aplica el bloqueo agresivo de scroll descrito
en la sección 8: si el contenido del detalle excede el alto de la ventana, impedir el
desplazamiento dejaría inaccesibles los últimos pasos.

---

## 7. Guía de Implementación

Esta sección explica cómo construir un tour desde cero. Cubre los tres tipos presentes en el
proyecto: el tour simple, el tour con modales simulados y el tour embebido en una página.

### 7.1 Tipo 1: Tour simple

Un tour simple resalta elementos que ya están presentes en la pantalla, sin modales ni cambios
de vista. El tour de Administración es el ejemplo canónico. Su construcción consta de cinco
etapas.

**Marcado de los elementos.** Cada elemento que se quiera explicar necesita un ancla estable en
el DOM: una clase o un atributo `data-tour`. Se recomienda un prefijo consistente para no
colisionar con estilos existentes.

```tsx
<Button className="tour-nuevo-empleado">Nuevo empleado</Button>
<Box className="tour-selector-tienda">...</Box>
```

**Definición de los pasos.** Se declara el arreglo de pasos, cada uno apuntando a uno de los
anclas anteriores. La propiedad `disableBeacon` en el primer paso evita el punto pulsante previo
y hace que el tour arranque directamente sobre el elemento.

```typescript
const ADMIN_STEPS: Step[] = [
  {
    target: '.tour-nuevo-empleado',
    disableBeacon: true,
    placement: 'bottom',
    content: (
      <>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
          Registra un empleado nuevo
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Este botón permite registrar un empleado nuevo en el sistema.
        </Typography>
      </>
    ),
  },
];
```

**Estado y arranque.** El motor necesita saber si el tour corre y en qué paso está. La función
de arranque coloca la vista en la parte superior antes de iniciar, para que el encabezado no
tape el primer elemento.

```typescript
const [runTour, setRunTour] = useState(false);
const [stepIndex, setStepIndex] = useState(0);

const startTour = () => {
  window.scrollTo(0, 0);
  setStepIndex(0);
  setRunTour(true);
};
```

**Manejador de eventos.** Reacciona al cierre y al avance o retroceso entre pasos.

```typescript
const handleCallback = (data: CallBackProps) => {
  const { status, action, type, index } = data;

  if (status === STATUS.FINISHED || status === STATUS.SKIPPED || action === ACTIONS.CLOSE) {
    setRunTour(false);
    setStepIndex(0);
    return;
  }

  if (type === EVENTS.STEP_AFTER && (action === ACTIONS.NEXT || action === ACTIONS.PREV)) {
    setStepIndex(action === ACTIONS.NEXT ? index + 1 : index - 1);
  }
};
```

**Montaje del motor.** La instancia de `Joyride` se coloca al final del render del componente,
recibiendo los pasos, el índice controlado, el manejador y el globo compartido.

```tsx
<Joyride
  run={runTour}
  steps={ADMIN_STEPS}
  stepIndex={stepIndex}
  callback={handleCallback}
  continuous
  showSkipButton
  disableOverlayClose
  tooltipComponent={CustomTooltip}
  styles={{
    options: { zIndex: 10000, arrowColor: '#fff', overlayColor: 'rgba(0,0,0,0.5)' },
    spotlight: { borderRadius: 8, boxShadow: '0 0 0 3px #004680, 0 0 25px rgba(0,74,153,0.4)' },
  }}
  locale={{ back: 'Atrás', last: 'Continuar', next: 'Siguiente', skip: 'Salir del tour' }}
/>
```

El disparador es un botón corriente cuyo `onClick` invoca la función de arranque.

### 7.2 Tipo 2: Tour con modales simulados

Un modal simulado es una réplica visual, sin funcionalidad, de un modal real de la aplicación.
Existe para poder explicar formularios que de otro modo obligarían al usuario a abrir el modal
verdadero y arriesgar la manipulación de datos reales. Los seis modales simulados del módulo de
Horarios explican el registro de novedad, el reporte de pausa, el cronómetro de pausa y las tres
exportaciones (pausas activas, novedades e historial).

**Construcción del modal.** Es un componente puramente visual, posicionado de forma fija y
centrado en la ventana, con los mismos campos que el modal real pero deshabilitados. Se muestra
u oculta según una propiedad `open`. Cada campo que se quiera explicar necesita su propio
identificador o clase, porque será el `target` de un paso.

```tsx
function FakeNovedadModal({ open }: { open: boolean }) {
  if (!open) return null;
  return (
    <Box sx={{ position: 'fixed', inset: 0, bgcolor: 'rgba(0,0,0,0.5)', zIndex: 1299,
               display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Box sx={{ bgcolor: '#fff', borderRadius: 4, p: 3, maxWidth: 600 }}>
        <TextField id="tour-modal-tipo" label="Tipo de novedad" disabled fullWidth />
        <TextField id="tour-modal-fecha-desde-field" label="Desde" disabled />
      </Box>
    </Box>
  );
}
```

El posicionamiento fijo y centrado es importante: garantiza que el modal simulado esté siempre
dentro de la ventana, con independencia del desplazamiento de la página.

**Asociación de los pasos al modal.** Cada modal declara la lista de `target` que le
pertenecen. El motor consulta esa lista para decidir qué modal mostrar en función del paso
activo.

```typescript
export const novedadModalTargets = [
  '#tour-modal-tipo',
  '#tour-modal-fecha-desde-field',
  '#tour-modal-observaciones-field',
];
```

En el motor, una función resuelve, a partir del `target` del paso, qué modal debe estar montado.

```typescript
const getOverlayForTarget = (target?: string | null): OverlayKind => {
  if (!target) return null;
  if (novedadModalTargets.includes(target)) return 'novedad';
  if (exportModalTargets.includes(target)) return 'exportar';
  return null;
};
```

**Sincronización del montaje.** Este es el punto delicado. Cuando el paso siguiente requiere un
modal que todavía no está montado, hay que montar el modal primero y esperar a que React lo
inserte en el DOM antes de avanzar el índice de paso; de lo contrario, el motor intentará
posicionar el globo sobre un elemento que aún no existe. La solución que emplea el proyecto es
diferir el avance del índice hasta después de que el modal se haya renderizado, encadenando dos
llamadas a `requestAnimationFrame`.

```typescript
if (overlayNeeded && overlayNeeded !== activeOverlay) {
  setActiveOverlay(overlayNeeded);
  setPendingStepIndex(targetIndex);
  return;
}
```

**Reutilización de chasis.** Cuando varios modales simulados comparten estructura, conviene
apoyarse en un chasis parametrizable en lugar de duplicar código. Los tres modales de
exportación se construyen sobre `FakeExportDialog.tsx`, que recibe título, subtítulo, prefijo de
identificadores y opciones; cada modal concreto es entonces un envoltorio breve. De forma
análoga, `GenericTourModal.tsx` sirve de base a los modales de novedad y de evento. Antes de
escribir un modal simulado desde cero conviene revisar si alguno de estos chasis ya cubre el
caso.

### 7.3 Tipo 3: Tour embebido en una página

Un tour embebido no vive en la carpeta `tour/`, sino dentro del componente de la página que
documenta. Es la opción adecuada cuando el tour es exclusivo de esa página y necesita acceder a
su estado interno. El tour de la vista de Reporte, alojado en `ReportePage.tsx`, es el ejemplo
del proyecto.

La diferencia respecto al tour simple no está en la mecánica, que es idéntica, sino en la
ubicación del código: el estado del tour, el arreglo de pasos, el manejador de eventos y la
instancia de `Joyride` se declaran dentro del propio componente de la página.

```tsx
export default function ReportePage(props) {
  const [runTour, setRunTour] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  const tourSteps: Step[] = [ /* ... */ ];
  const handleJoyrideCallback = (data: CallBackProps) => { /* ... */ };

  return (
    <Box>
      <Button onClick={() => { setStepIndex(0); setRunTour(true); }}>Tutorial</Button>

      {/* contenido de la página */}

      <Joyride
        run={runTour}
        steps={tourSteps}
        stepIndex={stepIndex}
        callback={handleJoyrideCallback}
        continuous
        tooltipComponent={CustomTooltip}
      />
    </Box>
  );
}
```

La ventaja de este enfoque es que el tour tiene acceso directo al estado de la página —props,
rol del usuario, pestaña activa—, lo que permite construir pasos dinámicos. Sus dos aplicaciones
en el tour de Reporte se describen a continuación.

**Cambio de pestaña durante el tour.** Algunos pasos deben mostrar el contenido de una pestaña
distinta a la activa. Cambiar la pestaña modifica el DOM, y hacerlo en el mismo ciclo en que se
avanza el paso desalinea el globo o provoca un fallo del motor. El patrón correcto es cambiar la
pestaña, ceder un ciclo para que React monte el nuevo contenido y sólo entonces avanzar el
índice.

```typescript
const STEP_TAB_REGISTROS = 6;
const STEP_TAB_NOVEDADES = 7;
const STEP_TAB_PAUSAS = 8;

if (tabParaMostrar) {
  setVisualizarTab(tabParaMostrar);
  setTimeout(() => setStepIndex(nextIndex), 80);
  return;
}
```

Los índices `STEP_TAB_*` son absolutos dentro del arreglo de pasos. Si se inserta o elimina un
paso al principio del arreglo, estos índices deben recalcularse; de lo contrario el tour
cambiaría de pestaña en el paso equivocado.

**Selección de `target` según el rol.** El selector de tienda de la vista de Reporte se
encuentra en un lugar distinto según el rol del usuario. Para el rol Area Manager está en el
encabezado, renderizado por `RegistrosPage.tsx` y marcado con `data-tour="reporte-tour-tienda-header"`;
para el rol de solo reporte está dentro de los filtros de la propia `ReportePage.tsx`, marcado
con `data-tour="reporte-tour-tienda"`. La página distingue ambos casos mediante la prop
`tiendasPermitidas`, que tiene valor para el Area Manager y es indefinida para el rol de solo
reporte. El paso correspondiente elige su `target` en función de ese dato.

```typescript
const tiendaTourTarget = tiendasPermitidas
  ? '[data-tour="reporte-tour-tienda-header"]'
  : '[data-tour="reporte-tour-tienda"]';
```

Si el paso usara un `target` fijo, en la vista donde ese elemento no se renderiza el tour
arrancaría sin encontrar dónde dibujar y quedaría bloqueado, con el botón de tutorial atascado
en su estado deshabilitado sin mostrar ningún recuadro. Este es precisamente el fallo que
motivó la corrección: el tour original apuntaba siempre al selector de los filtros, que no
existe para el Area Manager.

Conviene tener presente que este `target` introduce un acoplamiento entre archivos: el elemento
marcado como `reporte-tour-tienda-header` está en `RegistrosPage.tsx`, mientras que el tour vive
en `ReportePage.tsx`. Si ese selector del encabezado se moviera o eliminara, el primer paso del
tour para Area Manager dejaría de funcionar.

---

## 8. Bloqueo de Desplazamiento Durante el Tour

### 8.1 El requisito y el diagnóstico

Mientras un tour corre, la página debe permanecer fija para que el encabezado no tape el
elemento que se está explicando. El primer obstáculo para lograrlo es que el desplazamiento
vertical de la aplicación no lo genera el `body` ni el `html`, sino el contenedor `<main>` del
layout general, definido en `src/shared/components/layout/Layout.tsx`, que tiene
`overflowY: auto` y `height: 100vh` mientras la barra lateral permanece fija. En consecuencia,
cualquier intento de bloquear el desplazamiento aplicando `overflow: hidden` sobre `body` o
`html` no surte efecto, porque se está actuando sobre el elemento equivocado.

### 8.2 Por qué no debe alterarse el overflow del contenedor

La solución aparentemente directa —aplicar `overflow: hidden` sobre el `<main>` mientras el
tour corre— rompe el motor. Al cambiar el overflow, el contenedor recalcula su tamaño al
desaparecer su barra de desplazamiento, y `react-joyride`, que está midiendo ese mismo
contenedor para posicionar su overlay, pierde la referencia del nodo. El resultado es un fallo
intermitente que interrumpe el tour y muestra la pantalla de error de la aplicación:

```
Failed to execute 'removeChild' on 'Node': The node to be removed is not a child of this node.
```

La intermitencia proviene de que el fallo depende de la coincidencia temporal entre el
recálculo del contenedor y el ciclo de render del motor, lo que lo hace especialmente engañoso
de diagnosticar.

### 8.3 El enfoque correcto

La técnica que no interfiere con el motor consiste en no tocar el CSS del contenedor, sino
interceptar los eventos de desplazamiento del usuario —rueda del ratón y gesto táctil— sobre el
`<main>`, cancelándolos. El DOM que el motor observa permanece inalterado, por lo que no se
produce el fallo.

```typescript
useEffect(() => {
  if (!runTour) return;

  const main = document.querySelector<HTMLElement>('main');
  if (!main) return;

  main.scrollTop = 0;
  const block = (e: Event) => e.preventDefault();

  main.addEventListener('wheel', block, { passive: false });
  main.addEventListener('touchmove', block, { passive: false });

  return () => {
    main.removeEventListener('wheel', block);
    main.removeEventListener('touchmove', block);
  };
}, [runTour]);
```

El efecto coloca el contenedor en su parte superior al arrancar, de modo que el primer paso
quede visible bajo el encabezado, y retira los escuchadores al terminar el tour, por lo que es
completamente reversible. Como complemento, a la instancia de `Joyride` se le añaden las
opciones `disableScrolling` y `disableScrollParentFix`, para que el propio motor tampoco intente
desplazar la página.

Una limitación conocida de este enfoque es que la barra de desplazamiento permanece visible,
aunque inoperante; hacerla desaparecer exigiría alterar el overflow, que es justo lo que
reintroduce el fallo. Se prioriza la estabilidad.

El proyecto dispone además de un hook compartido, `src/shared/hooks/useScrollLockGuard.ts`, que
centraliza la lógica de bloqueo de desplazamiento a nivel de toda la aplicación. Antes de
reimplementar el bloqueo en un tour nuevo conviene revisar ese hook para reutilizarlo en lugar
de duplicar la lógica.

### 8.4 Anulación del encabezado fijo

En el tour de Registros, el encabezado de la página es fijo (`position: sticky`) y puede tapar
los elementos resaltados. Para evitarlo, `HorariosTourContext.tsx` inserta durante el tour una
regla de estilo temporal que lo neutraliza, y la retira al terminar.

```css
.tour-sticky-header { position: static !important; }
```

El encabezado de `RegistrosPage.tsx` lleva la clase `tour-sticky-header` para ser el objetivo de
esa regla.

---

## 9. Consideraciones para el Mantenimiento

Los puntos siguientes concentran los aspectos frágiles del sistema, aprendidos en la práctica, y
deberían revisarse antes de crear o modificar cualquier tour.

Cada tour es independiente y puede residir en un lugar inesperado. El de Reporte está embebido
en su página, no en la carpeta de tours. Antes de modificar un tour conviene confirmar en qué
archivo vive el de esa vista concreta; editar el archivo equivocado es la causa más frecuente de
que un cambio no tenga efecto.

Los `target` que dependen de condiciones de render exigen cuidado. Si un `data-tour` se
encuentra dentro de un bloque condicionado por un rol o por una pestaña, ese elemento no existe
cuando la condición es falsa, y el tour se bloquea. La solución es seleccionar el `target` de
forma dinámica, como en la sección 7.3.

El overflow de un contenedor no debe alterarse mientras el motor está activo, porque provoca el
fallo de `removeChild` descrito en la sección 8.2. Para bloquear el desplazamiento se
interceptan eventos, o se reutiliza `useScrollLockGuard`.

Cualquier cambio de DOM a mitad del tour —montar un modal, cambiar de pestaña— requiere el
patrón de ceder un ciclo antes de avanzar el paso. Ejecutar el cambio y el avance en el mismo
ciclo desalinea el globo o rompe el motor.

Los índices que disparan acciones —cambios de pestaña, montaje de modales— son absolutos dentro
del arreglo de pasos. Al insertar o eliminar pasos, deben recalcularse.

Finalmente, el tour de Monitoreo no admite el bloqueo agresivo de desplazamiento, porque su
contenido de detalle puede exceder el alto de la ventana y dejar pasos inaccesibles.

---

## 10. Referencia de Tours del Módulo

| Tour | Archivo | Naturaleza | Ámbito que documenta |
| ---- | ------- | ---------- | -------------------- |
| Registros | `components/tour/HorariosTour.tsx` (con `HorariosTourContext.tsx` y `tourSteps.tsx`) | Por fases, con modales simulados | Tarjetas, marcaciones y los modales de novedad, pausa y exportación. |
| Administración | `components/tour/AdminTour.tsx` | Simple, con un modal simulado | Alta y gestión de empleados, restringido al área de Sistemas. |
| Monitoreo | `components/tour/MonitoreoTour.tsx` (con `monitoreoTourSteps.tsx`) | Simple, con cambio de vista intermedio | Control de horas semanales. |
| Reporte | `pages/ReportePage.tsx` | Embebido en la página | Las tres pestañas de visualización de la vista de Reporte. |

Los archivos de apoyo compartidos son `TourTooltip.tsx`, que aporta el globo visual;
`TutorialButton.tsx`, el disparador del tour de Registros; `GenericTourModal.tsx` y
`FakeExportDialog.tsx`, chasis reutilizables de modales simulados; y
`src/shared/hooks/useScrollLockGuard.ts`, el hook compartido de bloqueo de desplazamiento.

El resto de módulos de la aplicación (reservas, traslados, curvas, contabilización,
notificaciones) implementan sus propios tours siguiendo la misma filosofía descrita en este
documento.

---

_Documentación de referencia del sistema de tutoriales guiados del módulo `src/apps/horarios`._