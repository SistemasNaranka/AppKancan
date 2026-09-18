# 🎯 Documentación — Aplicación de Ruleta de Premios

## 1. Descripción General

La aplicación de Ruleta de Premios es una herramienta promocional diseñada para incentivar las ventas en las tiendas autorizadas de KANCAN. Su propósito es permitir que los clientes que han realizado una compra con factura participen en un sorteo tipo ruleta, donde pueden ganar premios asignados según el monto de su compra.

La aplicación funciona como un sistema de puntos de venta donde una asesora o vendedora valida la factura de un cliente, verifica que cumpla con los requisitos mínimos de compra, y le permite girar una ruleta virtual para obtener un premio.

---

## 2. Objetivo Principal

**¿Qué se espera que haga la app?**

- Motivar a los clientes a facturar sus compras en las tiendas autorizadas.
- Asignar premios de forma aleatoria y justa según el valor de la compra.
- Controlar el stock de premios disponibles por tienda y por rango de precio.
- Garantizar que cada factura solo pueda participar una vez en la ruleta.
- Brindar a las asesoras una herramienta para gestionar los premios y el inventario.

---

## 3. Roles y Usuarios

La aplicación tiene un único rol de usuario principal, pero con dos vistas distintas según la función:

### 3.1 Cliente / Asesora (Usuario Principal)

Es la persona que está en el punto de venta y que ayuda al cliente a participar. La asesora:

- Ingresa el número de factura del cliente.
- Valida que la factura sea legítima y que el cliente pueda participar.
- Gira la ruleta en nombre del cliente.
- Recibe el premio ganado.

### 3.2 Administrador de Premios

Es la persona encargada de configurar la campaña. Esta función permite:

- Agregar nuevos premios al catálogo.
- Editar premios existentes.
- Asignar la cantidad de stock de cada premio por tienda.
- Desactivar premios que ya no se deseen ofrecer.

---

## 4. Conceptos Fundamentales

### 4.1 Tiendas Autorizadas

La ruleta solo funciona en tiendas específicas previamente definidas. Las tiendas autorizadas son aquellas que participan en la campaña promocional. Si una tienda no está en la lista autorizada, no puede participar en la ruleta.

### 4.2 Rangos de Precio (Tiers)

El monto de la compra determina el **rango** al que pertenece el cliente. Existen tres rangos:

| Rango | Monto de compra (con IVA) | Nivel |
|-------|---------------------------|-------|
| **G1 — Alto** | ≥ $600.000 | Premios de mayor valor |
| **G2 — Medio** | ≥ $300.000 y < $600.000 | Premios de valor intermedio |
| **G3 — Bajo** | < $300.000 | Premios de menor valor |

Una persona que haya comprado por $700.000 pertenece al rango G1 y solo puede ganar premios de ese nivel. Una persona que compró por $150.000 pertenece al rango G3.

**Importante:** Solo las compras iguales o superiores a $300.000 tienen acceso a la ruleta. Las compras por debajo de este umbral no pueden participar.

### 4.3 Premios

Cada premio pertenece a uno de los tres rangos (G1, G2 o G3). Los premios son artículos físicos o bonos de dinero que se entregan al cliente al ganar la ruleta.

Ejemplos de premios:
- **G1:** Jeans, bonos de $100.000
- **G2:** Blusas, bonos de $50.000, tote bags
- **G3:** Bandanas, bambas, bonos de $30.000

Cada premio tiene una **probabilidad** de ser seleccionado y una **cantidad de stock** asignado por tienda.

### 4.4 Stock y Cupo

Cada tienda tiene un stock limitado de premios. Esto significa que:

- Si una tienda tiene 5 unidades del premio "Jean de línea" (G1), solo los primeros 5 clientes en ese rango que ganen podrán recibir ese premio.
- Una vez agotado el stock de un premio en una tienda, ese premio ya no está disponible para los siguientes giros.
- Si todos los premios de un rango están agotados en una tienda, los clientes de ese rango no pueden participar.

---

## 5. Flujo del Cliente (Lo que el usuario experimenta)

### Paso 1 — Ingresar la factura
El cliente presenta su factura de compra a la asesora. La asesora ingresa el número de comprobante en la aplicación.

### Paso 2 — Validación
La aplicación verifica:
- Que la factura exista en el sistema de ventas.
- Que la factura no haya participado previamente en la ruleta (cada factura es única y solo permite un giro).
- Que la tienda donde se realizó la compra sea una tienda autorizada.
- Que el stock de premios disponibles en esa tienda y en el rango de compra no esté agotado.

### Paso 3 — Resultado de la validación
Se presentan tres posibles escenarios:

- **✅ Factura válida, puede girar:** El cliente puede proceder a girar la ruleta. Si queda una sola unidad de premio en su rango, se le informa al asesor que es la última oportunidad.
- **❌ Tienda sin premios disponibles:** No se puede girar en ningún rango. Se informa al cliente.
- **❌ Rango agotado:** El rango del cliente no tiene premios disponibles, pero otros rangos sí. El cliente no puede participar.

### Paso 4 — Girar la ruleta
Una vez validada la factura, el cliente pulsa el botón para girar la ruleta. La ruleta gira y se detiene en un premio asignado de forma aleatoria, respetando las probabilidades configuradas para cada premio.

### Paso 5 — Premiación
Se muestra el premio ganado en un modal de celebración. Se genera un cupón de regalo con un código único y una fecha de vencimiento (7 días).

---

## 6. Restricciones y Reglas de Negocio

1. **Un solo giro por factura:** Cada número de factura solo permite un participante en la ruleta. Si se intenta usar la misma factura una segunda vez, el sistema lo detecta y no permite el giro.

2. **Monto mínimo de compra:** Solo facturas iguales o superiores a $300.000 (con IVA) permiten participar.

3. **Stock limitado por tienda:** Los premios se asignan por tienda. Si el stock de una tienda se agota, aunque haya premios disponibles en otras tiendas, los clientes de esa tienda no pueden girar.

4. **Premios por rango:** Los clientes solo pueden ganar premios del rango correspondiente a su monto de compra. Un cliente G1 no puede ganar un premio G3.

5. **Una sola participación por factura:** El sistema mantiene un registro histórico de jugadas para evitar duplicados.

---

## 7. Componentes de la Aplicación

### 7.1 Vista Principal — "Ruleta de Premios"
Es la interfaz principal donde se realiza la interacción con el cliente:

- **Validador de factura:** Campo para ingresar el número de comprobante y botón de validación.
- **Indicador de estado:** Muestra si la factura es válida y si el cliente puede girar.
- **Ruleta visual:** La representación gráfica de la ruleta que gira.
- **Contador de premios:** Indica cuántos premios están disponibles.
- **Campana de alertas:** Un indicador visual que muestra si hay premios con stock crítico o agotado en alguno de los rangos.

### 7.2 Vista de Administración — "Administrar Premios"
Es la sección para la configuración de la campaña:

- **Lista de premios:** Muestra todos los premios disponibles organizados por tarjeta, con su imagen, nombre, rango y estado.
- **Agregar premio:** Formulario para crear nuevos premios asignando nombre, rango y stock por tienda.
- **Editar premio:** Permite modificar el nombre o el rango de un premio existente.
- **Eliminar premio:** Desactiva un premio (eliminación suave, no borra el historial de jugadas).
- **Stock por tienda:** Permite asignar la cantidad de cada premio por cada tienda autorizada.

---

## 8. Comportamiento Esperado

### Para el cliente final:
- Debe haber hecho una compra con factura en una tienda autorizada.
- El monto de su compra debe ser igual o superior a $300.000.
- Debe obtener un premio al girar (si hay stock disponible).
- Debe recibir un cupón con un código canjeable.

### Para la asesora:
- Debe poder validar cualquier factura rápidamente.
- Debe ser informada si la factura ya participó o si no hay stock disponible.
- Debe poder girar la ruleta con un solo clic.
- Debe poder ver el estado del stock de premios en todo momento.

### Para el administrador:
- Debe poder agregar, editar y desactivar premios.
- Debe poder asignar la cantidad de stock por tienda.
- Debe ver cuántos premios quedan disponibles en cada tienda.

---

## 9. Notas Importantes

- La aplicación **no está disponible para todas las tiendas**, solo para aquellas previamente autorizadas en la lista de tiendas permitidas.
- Los premios y sus cantidades son **configurables** y pueden cambiar según la campaña vigente.
- El sistema **no permite que una misma factura gane más de una vez**. Esto está estrictamente controlado.
- La aplicación se conecta a un sistema de gestión de inventario y ventas para validar las facturas y consultar el stock en tiempo real.
- Los premios tienen una **fecha de vencimiento** de 7 días desde que se ganan.

---

## 10. Resumen en una Frase

> La aplicación de Ruleta de Premios permite que los clientes que facturen compras mayores a $300.000 en tiendas autorizadas participen en un sorteo aleatorio para ganar premios según el rango de su compra, con control de stock en tiempo real y una sola participación por factura.

---

*Documentación elaborada el 17 de septiembre de 2026.*
*Esta documentación describe el comportamiento esencial y teórico de la aplicación, el cual puede estar sujeto a cambios según evoluciones del producto.*
