# Configuración de Colección: cumplimiento_mensual_comisiones

## Descripción

Esta colección permite configurar los umbrales de comisión por mes, reemplazando los valores quemados en el código.

## Campos

### mes (string)

- **Tipo**: String
- **Descripción**: Mes en formato numérico (01-12)
- **Ejemplo**: "12" para diciembre

### anio (string)

- **Tipo**: String
- **Descripción**: Año en formato YYYY
- **Ejemplo**: "2024"

### cumplimiento_valores (json)

- **Tipo**: JSON
- **Descripción**: Array de objetos con los umbrales de cumplimiento
- **Estructura**:

```json
[
  {
    "cumplimiento_min": 90,
    "comision_pct": 0.0035,
    "nombre": "Muy Regular"
  },
  {
    "cumplimiento_min": 95,
    "comision_pct": 0.005,
    "nombre": "Regular"
  },
  {
    "cumplimiento_min": 100,
    "comision_pct": 0.007,
    "nombre": "Buena"
  },
  {
    "cumplimiento_min": 110,
    "comision_pct": 0.01,
    "nombre": "Excelente"
  }
]
```

## Ejemplo de Registro

```json
{
  "mes": "12",
  "anio": "2024",
  "cumplimiento_valores": [
    {
      "cumplimiento_min": 90,
      "comision_pct": 0.0035,
      "nombre": "Muy Regular"
    },
    {
      "cumplimiento_min": 95,
      "comision_pct": 0.005,
      "nombre": "Regular"
    },
    {
      "cumplimiento_min": 100,
      "comision_pct": 0.007,
      "nombre": "Buena"
    },
    {
      "cumplimiento_min": 110,
      "comision_pct": 0.01,
      "nombre": "Excelente"
    }
  ]
}
```

## Uso

- Los umbrales se aplican automáticamente según el mes seleccionado
- Si no existe configuración para un mes, se usan los valores por defecto
- Los porcentajes de comisión deben estar en formato decimal (0.0035 = 0.35%)
