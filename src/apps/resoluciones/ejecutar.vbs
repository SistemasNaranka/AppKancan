' ==============================================================================
' ejecutar.vbs
' ==============================================================================

Set objShell = CreateObject("WScript.Shell")
Set objFSO = CreateObject("Scripting.FileSystemObject")

' --- CONFIGURACIÓN ---
Dim carpetaTrabajo
carpetaTrabajo = "C:\Users\PC-DESARROLLO\Documents\proyecto\AppKancan\src\apps\resoluciones"

Dim nombreExe
nombreExe = "actualizarResolucion.exe"

Dim rutaExe
rutaExe = carpetaTrabajo & "\" & nombreExe

Dim rutaLog
rutaLog = carpetaTrabajo & "\log_vbs.txt"
' ---------------------

' Obtener los argumentos de la URL
Dim urlCompleta
urlCompleta = ""
If WScript.Arguments.Count > 0 Then
    urlCompleta = WScript.Arguments(0)
End If

' Extraer los parámetros de la URL (después de ?)
Dim parametros
parametros = ""
Dim posicionInterrogacion
posicionInterrogacion = InStr(urlCompleta, "?")
If posicionInterrogacion > 0 Then
    parametros = Mid(urlCompleta, posicionInterrogacion + 1)
End If

' Decodificar URL (reemplazar %20 por espacio, etc.)
parametros = Replace(parametros, "%20", " ")
parametros = Replace(parametros, "+", " ")

' Crear o sobrescribir el archivo log
Set objLogVBS = objFSO.CreateTextFile(rutaLog, True)

objLogVBS.WriteLine "====================================="
objLogVBS.WriteLine "Iniciando VBS - " & Now
objLogVBS.WriteLine "Carpeta: " & carpetaTrabajo
objLogVBS.WriteLine "Archivo a ejecutar: " & rutaExe
objLogVBS.WriteLine "URL completa: " & urlCompleta
objLogVBS.WriteLine "Parametros extraidos: " & parametros

' 1️⃣ Verificar si existe el archivo
If objFSO.FileExists(rutaExe) Then
    objLogVBS.WriteLine "✔ Ejecutable encontrado."
Else
    objLogVBS.WriteLine "❌ ERROR: Ejecutable NO encontrado."
    objLogVBS.Close
    WScript.Quit
End If

' 2️⃣ Cambiar al directorio de trabajo
On Error Resume Next
objShell.CurrentDirectory = carpetaTrabajo

If Err.Number <> 0 Then
    objLogVBS.WriteLine "❌ Error al cambiar directorio: " & Err.Description
    objLogVBS.Close
    WScript.Quit
End If
On Error GoTo 0

' 3️⃣ Ejecutar el archivo .exe con los parámetros
objLogVBS.WriteLine "Ejecutando ejecutable con parametros..."

' 1 = Mostrar ventana
' True = Esperar a que termine
Dim codigoRetorno
Dim comandoCompleto
comandoCompleto = """" & rutaExe & """ " & parametros
objLogVBS.WriteLine "Comando: " & comandoCompleto
codigoRetorno = objShell.Run(comandoCompleto, 1, True)

objLogVBS.WriteLine "Codigo de retorno: " & codigoRetorno
objLogVBS.WriteLine "Finalizado - " & Now
objLogVBS.WriteLine "====================================="

objLogVBS.Close
WScript.Quit
