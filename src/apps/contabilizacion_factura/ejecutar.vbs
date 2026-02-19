' ==============================================================================
' ejecutar.vbs
' Propósito: Ejecutar programa corporativo desde la carpeta Roaming
' ==============================================================================

' Declaración de variables para mejor gestión de memoria
Option Explicit

Dim objShell, objFSO
Dim rutaRoaming, carpetaTrabajo, nombreExe, rutaCompletaExe
Dim args, argString

' Crear objetos necesarios para interactuar con el sistema operativo
Set objShell = CreateObject("WScript.Shell")
Set objFSO = CreateObject("Scripting.FileSystemObject")

' --- DETALLE DE RUTAS ---
' ExpandEnvironmentStrings convierte %APPDATA% en la ruta real del usuario actual
rutaRoaming = objShell.ExpandEnvironmentStrings("%APPDATA%")
carpetaTrabajo = rutaRoaming & "\contabilizacion_facturas"

' Nombre del ejecutable corporativo
nombreExe = "actualizarResolucion.exe" 
rutaCompletaExe = carpetaTrabajo & "\" & nombreExe
' ------------------------

' OBTENER ARGUMENTOS DESDE URL PROTOCOLO ---
' Los argumentos se pasan desde el navegador como: empresa://actualizar?param1=valor1&param2=valor2
' WScript.Arguments(0) contendrá la cadena de consulta después del ?
argString = ""
If WScript.Arguments.Count > 0 Then
    argString = " " & WScript.Arguments(0)
End If
' ------------------------

' --- LÓGICA DE EJECUCIÓN ---

' 1. Verificar si el ejecutable existe antes de intentar abrirlo
If Not objFSO.FileExists(rutaCompletaExe) Then
    MsgBox "Error: No se encontró el ejecutable en: " & rutaCompletaExe, 16, "Error de Configuración"
    WScript.Quit ' Salir del script si no existe
End If

' 2. Cambiar el directorio de trabajo activo a la carpeta Roaming
' Esto es vital para que el .exe encuentre sus propios archivos de configuración
objShell.CurrentDirectory = carpetaTrabajo

' 3. Ejecutar el programa con los parámetros
' Sintaxis Run: objShell.Run(strCommand, [intWindowStyle], [bWaitOnReturn])
' intWindowStyle: 1 para mostrar ventana, 0 para ocultar
' bWaitOnReturn: False para que React no se quede esperando a que el .exe cierre
objShell.Run """" & rutaCompletaExe & """" & argString, 1, False

' 4. Limpiar objetos de memoria
Set objShell = Nothing
Set objFSO = Nothing

' Cierra el script
WScript.Quit