Guía de WebSockets con Directus SDK
Esta guía explica cómo implementar la funcionalidad de tiempo real (WebSockets) en AppKancan utilizando el SDK oficial de Directus. Esta funcionalidad permite que los cambios en la base de datos se reflejen instantáneamente en todos los clientes conectados sin necesidad de recargar la página o hacer polling.

1. Conceptos Básicos
   Los WebSockets permiten una comunicación bidireccional entre el cliente y el servidor. En Directus, esto se utiliza principalmente para:
   Suscripciones: Recibir notificaciones cuando un registro se crea, actualiza o elimina.
   Eventos: Reaccionar a cambios específicos en una colección.
2. Configuración del Cliente
   El cliente de Directus en src/services/directus/directus.ts ya está configurado para soportar tiempo real mediante el plugin realtime():
   import { createDirectus, rest, authentication, realtime } from "@directus/sdk";

const directus = createDirectus(url)
.with(authentication("json"))
.with(rest())
.with(realtime()); // Habilita WebSockets 3. Uso Básico: Suscripciones
Para escuchar cambios en una colección, utilizamos el método subscribe.
Ejemplo Básico
import directus from "@/services/directus/directus";

async function setupSubscription() {
const { subscription, stop } = await directus.subscribe('mi_coleccion', {
query: { fields: ['*'] },
event: 'update', // O 'create', 'delete'
});

// Escuchar mensajes
for await (const message of subscription) {
console.log('Cambio detectado:', message);
}
} 4. Integración en React (Patrón AppKancan)
En AppKancan, utilizamos un patrón dentro de useEffect para manejar el ciclo de vida de la suscripción.
Ejemplo: Sincronización de Inventario
Este es el patrón utilizado en EnviosPage.tsx para sincronizar escaneos entre múltiples usuarios:
useEffect(() => {
let stopSubscription: () => void;

const startSub = async () => {
try {
// 1. Iniciar suscripción
const { subscription, stop } = await directus.subscribe("envios_curvas", {
event: "create", // Podemos escuchar múltiples eventos
query: {
fields: ["id", "tienda_id", "cantidad_talla"]
},
});

      stopSubscription = stop;

      // 2. Procesar mensajes en un loop infinito
      for await (const item of subscription) {
        if (item.event === "create" || item.event === "update") {
          // Lógica para actualizar el estado local de React
          console.log("Nuevo envío detectado en tiempo real", item.data);

          // Ejemplo: Forzar una recarga de datos o actualizar un átomo/contexto
          setTrigger(prev => prev + 1);
        }
      }
    } catch (err) {
      console.error("Error en WebSocket:", err);
    }

};

startSub();

// 3. LIMPIEZA: Muy importante para evitar fugas de memoria
return () => {
if (stopSubscription) stopSubscription();
};
}, []); 5. Caso de Uso: Auto-guardado Debounced
Combinamos WebSockets con un Auto-guardado para una experiencia "Google Docs":
Escaneo: El usuario escanea un código. El estado local cambia.
Debounce (7s): Un useEffect espera 7 segundos de inactividad.
Persistencia: Se guardan los datos en Directus.
Broadcast: Directus emite vía WebSocket el cambio a los demás usuarios.
Sync: Los demás clientes reciben el evento y actualizan su vista automáticamente. 6. Recomendaciones y Buenas Prácticas
Filtros de Suscripción: Siempre intenta filtrar la suscripción mediante query para no recibir datos innecesarios.
Manejo de Errores: Las suscripciones pueden caerse si el internet falla. El SDK intenta reconectar, pero es bueno envolver la lógica en try/catch.
Limpieza (Cleanup): Siempre llama a la función stop() en el retorno del useEffect. Si no lo haces, se acumularán múltiples conexiones abiertas.
No abusar: Usa WebSockets solo para datos que realmente necesiten ser "vivos" (como inventarios compartidos, chats o notificaciones). Para datos estáticos, usa REST normal.

---

Documentación creada para el equipo de desarrollo de AppKancan - Abril 2026
