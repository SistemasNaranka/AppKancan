import React, { useState, useEffect } from 'react';
import { Box, Typography, Snackbar, Alert, Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress, Card, CardContent, AlertTitle, Stack } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import { Resolucion, EstadoResolucion } from '../types';
import SearchBar from '../components/SearchBar';
import StatusFilters from '../components/StatusFilters';
import RazonSocialFilter from '../components/RazonSocialFilter';
import ResolutionCard from '../components/ResolutionCard';
import ResolutionTable from '../components/ResolutionTable';
import Pagination from '../components/Pagination';
import Button from '../components/Button';
import { red } from '@mui/material/colors';
import { leerPDF } from '../pdfReader';
import { obtenerResoluciones, aplanarResolucion, calcularVencimiento, crearResolucion } from '../../../services/directus/resolucionesApi';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

const ResolucionesHome = () => {
  // Estado para la búsqueda
  const [busqueda, setBusqueda] = useState('');

  //Estado para el filtro RazonSocial

  const [filtroRazonSocial, setFiltroRazonSocial] = useState('Todas');
  
  // Estado para el filtro activo
  const [filtroEstado, setFiltroEstado] = useState<EstadoResolucion | null>(null);
  
  // Estado para la resolución seleccionada
  const [resolucionSeleccionada, setResolucionSeleccionada] = useState<Resolucion | null>(null);
  
  // Estado para la paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const [snackbar, setSnackbar] = useState({ open: false, mensaje: '', tipo: 'success' as 'success' | 'error' });
  const [resoluciones, setResoluciones] = useState<Resolucion[]>([]);
  const [cargandoDatos, setCargandoDatos] = useState(true);
  

// Configuración de paginación
const itemsPorPagina = 7;


//Estado de cargado
const [cargando, setCargando] = useState(false);
const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);

useEffect(() => {
  async function cargarDatos() {
    try {
      setCargandoDatos(true);
      const datos = await obtenerResoluciones();
      const resolucionesAplanadas = datos.map(aplanarResolucion);
      setResoluciones(resolucionesAplanadas);
    } catch (error) {
      console.error('Error cargando resoluciones:', error);
      setSnackbar({ open: true, mensaje: 'Error al cargar resoluciones', tipo: 'error' });
    } finally {
      setCargandoDatos(false);
    }
  }
  cargarDatos();
}, []);

// Timer para cerrar automáticamente las alertas
useEffect(() => {
  if (snackbar.open) {
    const timer = setTimeout(() => {
      setSnackbar({ ...snackbar, open: false });
    }, 5000); // 5 segundos
    return () => clearTimeout(timer);
  }
}, [snackbar.open]);

// Función para ordenar por urgencia de estado
const ordenarPorEstado = (registros: Resolucion[]) => {
  const ordenEstado: { [key: string]: number } = {
    'Pendiente': 0,
    'Por vencer': 1,
    'Vigente': 2,
    'Vencido': 3,
  };
  return [...registros].sort((a, b) => ordenEstado[a.estado] - ordenEstado[b.estado]);
};

const todasResoluciones = ordenarPorEstado([...resoluciones]);

// Filtrar por búsqueda
const resolucionesBuscadas = busqueda
  ? todasResoluciones.filter((r) => 
      r.numero_formulario.toLowerCase().includes(busqueda.toLowerCase()) ||
      r.tienda_nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      r.prefijo.toLowerCase().includes(busqueda.toLowerCase())
    )
  : todasResoluciones;

  // Calcular totales por estado
  const totalPendientes = todasResoluciones.filter(r => r.estado === 'Pendiente').length;
  const totalPorVencer = todasResoluciones.filter(r => r.estado === 'Por vencer').length;
  const totalVigentes = todasResoluciones.filter(r => r.estado === 'Vigente').length;
  const totalVencidos = todasResoluciones.filter(r => r.estado === 'Vencido').length;
  const totalResoluciones = totalPendientes + totalPorVencer + totalVigentes + totalVencidos;

// Filtrar por razón social
const resolucionesPorRazonSocial = filtroRazonSocial !== 'Todas'
  ? resolucionesBuscadas.filter((r) => r.razon_social === filtroRazonSocial)
  : resolucionesBuscadas;

// Filtrar por estado
const resolucionesFiltradas = filtroEstado
  ? resolucionesPorRazonSocial.filter((r) => r.estado === filtroEstado)
  : resolucionesPorRazonSocial;

// Configuración de paginación (actualizada con las filtradas)
const totalPaginas = Math.ceil(resolucionesFiltradas.length / itemsPorPagina);

// Obtener resoluciones de la página actual
const resolucionesPaginadas = resolucionesFiltradas.slice(
  (paginaActual - 1) * itemsPorPagina,
  paginaActual * itemsPorPagina
);

// Funciones
const handleIntegrar = () => {
  if (!resolucionSeleccionada) return;

  const yaExiste = resoluciones.some(
    (r) => r.numero_formulario === resolucionSeleccionada.numero_formulario
  );

  if (yaExiste) {
    setSnackbar({ open: true, mensaje: 'Esta resolución ya está integrada', tipo: 'error' });
    return;
  }

  setMostrarConfirmacion(true);
};

const confirmarIntegracion = async () => {
  if (!resolucionSeleccionada) return;

  let empresa = '';
  if (resolucionSeleccionada.razon_social === 'NARANKA SAS') {
    empresa = 'naranka';
  } else if (resolucionSeleccionada.razon_social === 'MARIA FERNANDA PEREZ VELEZ') {
    empresa = 'kancan';
  } else if (resolucionSeleccionada.razon_social === 'KAN CAN JEANS') {
    empresa = 'kancanjeans';
  }

  const params = [
    `resolucion=${resolucionSeleccionada.numero_formulario}`,
    `empresa=${empresa}`,
    `prefijo=${resolucionSeleccionada.prefijo}`,
    `desde=${resolucionSeleccionada.desde_numero}`,
    `hasta=${resolucionSeleccionada.hasta_numero}`,
    `fecha=${resolucionSeleccionada.fecha_creacion}`,
    `vigencia=${resolucionSeleccionada.vigencia}`,
    `motivo=${resolucionSeleccionada.tipo_solicitud}`,
    `enteFacturador=Principal`,
  ].join('&');

  // Cerrar modal
  setMostrarConfirmacion(false);

  try {
    // Guardar en la base de datos
    await crearResolucion({
      numero_formulario: resolucionSeleccionada.numero_formulario,
      razon_social: resolucionSeleccionada.razon_social,
      prefijo: resolucionSeleccionada.prefijo,
      desde_numero: resolucionSeleccionada.desde_numero,
      hasta_numero: resolucionSeleccionada.hasta_numero,
      vigencia: resolucionSeleccionada.vigencia,
      tipo_solicitud: resolucionSeleccionada.tipo_solicitud,
      fecha_creacion: resolucionSeleccionada.fecha_creacion,
      fecha_vencimiento: resolucionSeleccionada.fecha_vencimiento,
    });

    // Ejecutar el protocolo
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = `miempresa://?${params}`;
    document.body.appendChild(iframe);
    setTimeout(() => document.body.removeChild(iframe), 1000);

    // Recargar las resoluciones desde la base de datos
    const datos = await obtenerResoluciones();
    const resolucionesAplanadas = datos.map(aplanarResolucion);
    setResoluciones(resolucionesAplanadas);

    setResolucionSeleccionada(null);
    setSnackbar({ open: true, mensaje: 'Resolución integrada correctamente', tipo: 'success' });

  } catch (error: any) {
    setSnackbar({ open: true, mensaje: error.message || 'Error al integrar', tipo: 'error' });
  }
};

  const handleLimpiar = () => {
    setResolucionSeleccionada(null);
  };

const handleSubirArchivo = async (archivo: File) => {
  setCargando(true);

  const resultado = await leerPDF(archivo);

  if (typeof resultado === 'string') {
    // Es un mensaje de error
    setSnackbar({ open: true, mensaje: resultado, tipo: 'error' });
    setCargando(false);
    return;
  }

  // Crear resolución con los datos extraídos
const nuevaResolucion: Resolucion = {
  id: Date.now(),
  numero_formulario: resultado.numero_formulario,
  razon_social: resultado.razon_social,
  prefijo: resultado.prefijo,
  desde_numero: resultado.desde_numero,
  hasta_numero: resultado.hasta_numero,
  vigencia: resultado.vigencia,
  tipo_solicitud: resultado.tipo_solicitud,
  fecha_creacion: resultado.fecha_creacion,
  fecha_vencimiento: calcularVencimiento(resultado.fecha_creacion, resultado.vigencia),
  ultima_factura: 0,
  estado: 'Pendiente',
  tienda_nombre: resultado.tienda_nombre,
  ente_facturador: 'Principal',
};

  setResolucionSeleccionada(nuevaResolucion);
  setCargando(false);
};

const handleExportar = async () => {
  const dataExportar = resolucionesFiltradas;

  if (dataExportar.length === 0) {
    setSnackbar({ open: true, mensaje: 'No hay datos para exportar', tipo: 'error' });
    return;
  }

  // Crear libro y hoja
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Resoluciones');

  // Definir columnas
  const columnas = [
    { key: 'numero_formulario', header: 'Resolución' },
    { key: 'razon_social', header: 'Razón Social' },
    { key: 'prefijo', header: 'Prefijo' },
    { key: 'tienda_nombre', header: 'Tienda' },
    { key: 'desde_numero', header: 'Desde' },
    { key: 'hasta_numero', header: 'Hasta' },
    { key: 'vigencia', header: 'Vigencia' },
    { key: 'fecha_creacion', header: 'Fecha' },
    { key: 'fecha_vencimiento', header: 'Fecha Vencimiento' },
    { key: 'estado', header: 'Estado' },
  ];

  // Configurar columnas en la hoja
  worksheet.columns = columnas.map(col => ({
    header: col.header,
    key: col.key,
    width: 20,
  }));

  // Estilo del encabezado
  const headerRow = worksheet.getRow(1);
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '4F81BD' },
    };
    cell.font = {
      bold: true,
      color: { argb: 'FFFFFF' },
    };
    cell.alignment = {
      horizontal: 'center',
      vertical: 'middle',
    };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    };
  });

  // Agregar datos
  dataExportar.forEach((resolucion) => {
    const row = worksheet.addRow({
      numero_formulario: resolucion.numero_formulario,
      razon_social: resolucion.razon_social,
      prefijo: resolucion.prefijo,
      tienda_nombre: resolucion.tienda_nombre,
      desde_numero: resolucion.desde_numero,
      hasta_numero: resolucion.hasta_numero,
      vigencia: resolucion.vigencia,
      fecha_creacion: resolucion.fecha_creacion,
      fecha_vencimiento: resolucion.fecha_vencimiento,
      estado: resolucion.estado,
    });

    // Estilo de las celdas de datos
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
      cell.alignment = {
        vertical: 'top',
      };
    });
  });

  // Auto-ajustar ancho de columnas
  worksheet.columns.forEach((column) => {
    if (column.values) {
      let maxLength = 10;
      column.values.forEach((value) => {
        if (value) {
          const length = String(value).length;
          if (length > maxLength) {
            maxLength = length;
          }
        }
      });
      column.width = maxLength + 2;
    }
  });

  // Agregar filtros
    worksheet.autoFilter = {
      from: 'A1',
      to: `J${dataExportar.length + 1}`,
    };

  // Congelar encabezado
  worksheet.views = [{ state: 'frozen', ySplit: 1 }];

  // Generar archivo y descargar
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `resoluciones_${new Date().toISOString().split('T')[0]}.xlsx`);
};


  const handleSeleccionar = (resolucion: Resolucion) => {
    setResolucionSeleccionada(resolucion);
  };


  return (
    <Box sx={{ display: 'flex', gap: 3, p: 3, minHeight: '100vh', backgroundColor: 'hide' }}>
      {/* Panel Izquierdo */}
      <Box sx={{ width: 400 }}>
        <ResolutionCard
          resolucion={resolucionSeleccionada}
          onIntegrar={handleIntegrar}
          onLimpiar={handleLimpiar}
          onSubirArchivo={handleSubirArchivo}
        />
      </Box>

      {/* Panel Derecho */}
      <Box sx={{ flex: 1 }}>

      {/* Título y Total */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1a2a3a' }}>
            Resoluciones
          </Typography>
          <Card sx={{ backgroundColor: '#ffffff', border: '1px solid #ddd', minWidth: 192.5, borderLeft: '4px solid #1976d2' }}>
            <CardContent sx={{ py: 0.5, px: 1, '&:last-child': { pb: 0.5 }, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                Total
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                {totalResoluciones}
              </Typography> 
            </CardContent>
          </Card>
        </Box>

        {/* Tarjetas de resumen */}
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <Card sx={{ flex: 1, backgroundColor: '#ffffff', borderLeft: '4px solid #989898' }}>
              <CardContent sx={{ py: 1, px: 2, '&:last-child': { pb: 1 }, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">
                  Pendientes
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#989898' }}>
                  {totalPendientes}
                </Typography>
              </CardContent>
            </Card>
            
            <Card sx={{ flex: 1, backgroundColor: '#ffffff', borderLeft: '4px solid #ed6c02' }}>
              <CardContent sx={{ py: 1, px: 2, '&:last-child': { pb: 1 }, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">
                  Por vencer
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#ed6c02' }}>
                  {totalPorVencer}
                </Typography>
              </CardContent>
            </Card>
            
            <Card sx={{ flex: 1, backgroundColor: '#ffffff', borderLeft: '4px solid #2e7d32' }}>
              <CardContent sx={{ py: 1, px: 2, '&:last-child': { pb: 1 }, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">
                  Vigentes
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#2e7d32' }}>
                  {totalVigentes}
                </Typography>
              </CardContent>
            </Card>
            
            <Card sx={{ flex: 1, backgroundColor: '#ffffff', borderLeft: '4px solid #d32f2f' }}>
              <CardContent sx={{ py: 1, px: 2, '&:last-child': { pb: 1 }, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">
                  Vencidos
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#d32f2f' }}>
                  {totalVencidos}
                </Typography>
              </CardContent>
            </Card>
          </Box>


        {/* Barra de búsqueda */}
       <SearchBar
          valor={busqueda}
          onChange={(valor) => {
            setBusqueda(valor);
            setPaginaActual(1);
          }}
        />

       {/* Filtros y botón exportar */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', my: 2, color: '#004680'}}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center',}}>
             <RazonSocialFilter
                valor={filtroRazonSocial}
                opciones={['NARANKA SAS', 'KAN CAN JEANS', 'MARIA FERNANDA PEREZ VELEZ']}
                onChange={(valor) => {
                  setFiltroRazonSocial(valor);
                  setPaginaActual(1);
                }}
              />

              <StatusFilters
                estadoActivo={filtroEstado}
                onFiltrar={setFiltroEstado}
              />
            </Box>

            <Button
              texto="Exportar"
              onClick={handleExportar}
              variante="secundario"
              icono={<DownloadIcon />}
            />
          </Box>

        {/* Tabla */}
          {cargandoDatos ? (
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                py: 8,
                flexDirection: 'column',
                gap: 2
              }}>
                <CircularProgress size={50} />
                <Typography color="text.secondary">
                  Cargando resoluciones...
                </Typography>
              </Box>
            ) : (
              <ResolutionTable
                resoluciones={resolucionesPaginadas}
                onSeleccionar={handleSeleccionar}
              />
            )}

        {/* Paginación */}
        <Pagination
          paginaActual={paginaActual}
          totalPaginas={totalPaginas}
          onCambiarPagina={setPaginaActual}
        />

        <Dialog
  open={mostrarConfirmacion}
  onClose={() => setMostrarConfirmacion(false)}
  PaperProps={{
    sx: { borderRadius: 3, p: 1 }
  }}
>
  <DialogTitle sx={{ fontWeight: 'bold' }}>
    Confirmar Integración
  </DialogTitle>
  <DialogContent>
    <Typography>
      ¿Deseas integrar la resolución <strong>{resolucionSeleccionada?.numero_formulario}</strong>?
    </Typography>
    <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
      Esto abrirá el programa corporativo para completar el proceso.
    </Typography>
  </DialogContent>
  <DialogActions sx={{ p: 2, gap: 1 }}>
    <Button
      texto="Cancelar"
      variante="secundario"
      onClick={() => setMostrarConfirmacion(false)}
    />
    <Button
      texto="Integrar"
      variante="primario"
      onClick={confirmarIntegracion}
    />
  </DialogActions>
</Dialog>

        {snackbar.open && (
          <Box
            sx={{
              position: 'fixed',
              bottom: 20,
              left: 20,
              zIndex: 9999,
            }}
          >
            <Alert
              severity={snackbar.tipo}
              variant="filled"
              sx={{
                boxShadow: 3,
                minWidth: 300,
                ...(snackbar.tipo === 'success' && {
                backgroundColor: '#2e7d32', // Color para éxito
                color: '#ffffff',
              }),
                ...(snackbar.tipo === 'error' && {
                backgroundColor: '#d32f2f', // Color para error
                color: '#ffffff',
              }),
            }}
          >
              {snackbar.mensaje}
            </Alert>
          </Box>
        )}
</Box>
    </Box>
  );
};

export default ResolucionesHome;