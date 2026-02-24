Estructura basada en un informe final que muestre al usuario la venta de la información seria final

nombre de asesor su venta en unidades , el valor de la venta, la tienda o bodega que pertenece, la zona en la que pertenece, y esto unos filtros de fecha y de días es decir poder decir el rango en que fecha desde donde hasta donde
la venta tiene una linea de venta que se conocen como colección , básicos, promoción, liquidación, segunda y cada linea de venta tiene su agrupación que pueden ser indigo y liviano
esto se realizaba en power bi con las siguientes consulta de una base dedatos que las credneciales ya las se y el puerto y todo igual

consulta de datos que se tenían en power bi

let
Origen = Odbc.Query("Driver={MySQL ODBC 8.0 ANSI Driver}; Server={192.168.19.250}; Database={kancan}", "SELECT \*#(lf)FROM procesos"),
#"Columnas con nombre cambiado" = Table.RenameColumns(Origen,{{"id", "ID"}, {"nombre", "Nombre"}, {"area", "Area"}})
in
#"Columnas con nombre cambiado"

---

let
Origen = Odbc.Query("Driver={MySQL ODBC 8.0 ANSI Driver}; Server={192.168.19.250}; Database={kancan}", "SELECT \*#(lf)FROM ciudades ORDER BY nombre"),
#"Columnas con nombre cambiado" = Table.RenameColumns(Origen,{{"id", "ID"}, {"nombre", "Nombre"}, {"departamento", "Departamento"}})
in
#"Columnas con nombre cambiado"

---

let
Origen = Odbc.Query("Driver={MySQL ODBC 8.0 ANSI Driver}; Server={192.168.19.250}; Database={naranka}", "SELECT \*#(lf)FROM grupos"),
#"Cambiar nombre de columnas" = Table.RenameColumns(Origen,{{"id", "ID"}, {"nombre", "Nombre"}, {"tipo_prenda", "Tipo Prenda"}, {"agrupacion", "Agrupacion"}})
in
#"Cambiar nombre de columnas"

---

let
Origen = Odbc.Query("Driver={MySQL ODBC 8.0 ANSI Driver}; Server={192.168.19.250}; Database={naranka}", "SELECT \*#(lf)FROM capsulas"),
#"Columnas con nombre cambiado" = Table.RenameColumns(Origen,{{"id", "Id"}, {"nombre", "Nombre"}, {"coleccion", "Coleccion"}, {"fecha_inicio", "Fecha inicio"}, {"fecha_lanzamiento", "Fecha lanzamiento"}})
in
#"Columnas con nombre cambiado"

---

let
Origen = Odbc.Query("Driver={MySQL ODBC 8.0 ANSI Driver}; Server={192.168.19.250}; Database={naranka}", "SELECT \*#(lf)FROM capsulas"),
#"Columnas con nombre cambiado" = Table.RenameColumns(Origen,{{"id", "Id"}, {"nombre", "Nombre"}, {"coleccion", "Coleccion"}, {"fecha_inicio", "Fecha inicio"}, {"fecha_lanzamiento", "Fecha lanzamiento"}})
in
#"Columnas con nombre cambiado"

---

let
Origen = Odbc.Query("Driver={MySQL ODBC 8.0 ANSI Driver}; Server={192.168.19.250}; Database={kancan}", "SELECT \*#(lf)FROM subprocesos"),
#"Columnas con nombre cambiado" = Table.RenameColumns(Origen,{{"id", "ID"}, {"nombre", "Nombre"}, {"id_proceso", "ID Proceso"}})
in
#"Columnas con nombre cambiado"

---

let
Origen = Odbc.Query("Driver={MySQL ODBC 8.0 ANSI Driver}; Server={192.168.19.250}; Database={kancan}", "SELECT \*#(lf)FROM bodegas"),
#"Columnas con nombre cambiado" = Table.RenameColumns(Origen,{{"id", "ID"}, {"nombre", "Nombre"}, {"ciudad", "Ciudad"}, {"codigo_ultra", "Codigo Ultra"}, {"subproceso_nombre", "Subproceso"}, {"categoria", "Categoria"}})
in
#"Columnas con nombre cambiado"

---

let
Origen = Odbc.Query("Driver={MySQL ODBC 8.0 ANSI Driver}; Server={192.168.19.250}; Database={naranka}", "SELECT \*#(lf)FROM referencias_capsula"),
#"Columnas con nombre cambiado" = Table.RenameColumns(Origen,{{"id_referencia", "ID Referencia"}, {"id_capsula", "ID Capsula"}, {"unidades", "Unidades"}})
in
#"Columnas con nombre cambiado"

---

let
Origen = Odbc.Query("Driver={MySQL ODBC 8.0 ANSI Driver}; Server={192.168.19.250}; Database={naranka}", "SELECT \*#(lf)FROM grupos_homogeneos"),
#"Cambiar nombre de columnas" = Table.RenameColumns(Origen,{{"id", "ID"}, {"nombre", "Nombre"}, {"origen", "Origen"}, {"linea_venta", "Linea Venta"}, {"id_grupo", "ID Grupo"}})
in
#"Cambiar nombre de columnas"

---

let
Origen = Odbc.Query("Driver={MySQL ODBC 8.0 ANSI Driver}; Server={192.168.19.250}; Database={kcn_db}", "SELECT#(lf)#(tab)tras._#(lf)FROM#(lf)#(tab)kcn_db.traslados_2025 AS tras#(lf)WHERE#(lf)#(tab)tras.estado='Transito'#(lf)#(tab)AND tras.bodega_entra BETWEEN 3 AND 20#(lf)#(lf)UNION ALL#(lf)#(lf)SELECT#(lf)#(tab)tras._#(lf)FROM#(lf)#(tab)naranka.traslados_2025 AS tras#(lf)WHERE#(lf)#(tab)tras.estado='Transito'#(lf)#(lf)#(lf)UNION ALL#(lf)#(lf)SELECT#(lf)#(tab)tras._#(lf)FROM#(lf)#(tab)kcn_db.traslados_2026 AS tras#(lf)WHERE#(lf)#(tab)tras.estado='Transito'#(lf)#(tab)AND tras.bodega_entra BETWEEN 3 AND 20#(lf)#(lf)UNION ALL#(lf)#(lf)SELECT#(lf)#(tab)tras._#(lf)FROM#(lf)#(tab)naranka.traslados_2026 AS tras#(lf)WHERE#(lf)#(tab)tras.estado='Transito'#(lf)#(tab)AND tras.bodega_entra > 900#(lf)#(lf)"),
#"Cambiar nombre de columnas" = Table.RenameColumns(Origen,{{"referencia", "ID Referencia"}, {"cantidad", "Existencias"}})
in
#"Cambiar nombre de columnas"

---

let
Origen = Odbc.Query("Driver={MySQL ODBC 8.0 ANSI Driver}; Server={192.168.19.250}; Database={naranka}", "SELECT#(lf)#(tab)tras._#(lf)FROM#(lf)#(tab)naranka.traslados_2025 AS tras#(lf)WHERE#(lf)#(tab)tras.estado='Transito'#(lf)#(tab)AND tras.bodega_entra BETWEEN 3 AND 40#(lf)#(lf)UNION ALL#(lf)#(lf)SELECT#(lf)#(tab)tras._#(lf)FROM#(lf)#(tab)kcn_db.traslados_2025 AS tras#(lf)WHERE#(lf)#(tab)tras.estado='Transito'#(lf)#(tab)AND tras.bodega_entra > 900#(lf)#(lf)UNION ALL#(lf)#(lf)SELECT#(lf)#(tab)tras._#(lf)FROM#(lf)#(tab)naranka.traslados_2026 AS tras#(lf)WHERE#(lf)#(tab)tras.estado='Transito'#(lf)#(tab)AND tras.bodega_entra BETWEEN 3 AND 40#(lf)#(lf)UNION ALL#(lf)#(lf)SELECT#(lf)#(tab)tras._#(lf)FROM#(lf)#(tab)kcn_db.traslados_2026 AS tras#(lf)WHERE#(lf)#(tab)tras.estado='Transito'#(lf)#(tab)AND tras.bodega_entra > 900"),
#"Cambiar nombre de columnas" = Table.RenameColumns(Origen,{{"referencia", "ID Referencia"}, {"cantidad", "Existencias"}}),
#"Anexar [INVENTARIO_TRANSITO_KANCAN]" = Table.Combine({#"Cambiar nombre de columnas", INVENTARIO_TRANSITO_KANCAN}),
#"Agrupar @ID Referencia" = Table.Group(#"Anexar [INVENTARIO_TRANSITO_KANCAN]", {"ID Referencia"}, {{"Existencias", each List.Sum([Existencias]), type number}}),
#"Agregar @Almacen" = Table.AddColumn(#"Agrupar @ID Referencia", "Bodega", each "Transito"),
#"Valor reemplazado" = Table.ReplaceValue(#"Agregar @Almacen","UNICO CALI - BODEGA","UNICO CALI",Replacer.ReplaceText,{"Bodega"})
in
#"Valor reemplazado"

---

let
Origen = Odbc.Query("Driver={MySQL ODBC 8.0 ANSI Driver}; Server={192.168.19.250}; Database={naranka}", "SELECT#(lf)#(tab)tras._#(lf)FROM#(lf)#(tab)naranka.traslados_2025 AS tras#(lf)WHERE#(lf)#(tab)tras.estado='Transito'#(lf)#(tab)AND tras.bodega_entra BETWEEN 3 AND 40#(lf)#(lf)UNION ALL#(lf)#(lf)SELECT#(lf)#(tab)tras._#(lf)FROM#(lf)#(tab)kcn_db.traslados_2025 AS tras#(lf)WHERE#(lf)#(tab)tras.estado='Transito'#(lf)#(tab)AND tras.bodega_entra > 900#(lf)#(lf)UNION ALL#(lf)#(lf)SELECT#(lf)#(tab)tras._#(lf)FROM#(lf)#(tab)naranka.traslados_2026 AS tras#(lf)WHERE#(lf)#(tab)tras.estado='Transito'#(lf)#(tab)AND tras.bodega_entra BETWEEN 3 AND 40#(lf)#(lf)UNION ALL#(lf)#(lf)SELECT#(lf)#(tab)tras._#(lf)FROM#(lf)#(tab)kcn_db.traslados_2026 AS tras#(lf)WHERE#(lf)#(tab)tras.estado='Transito'#(lf)#(tab)AND tras.bodega_entra > 900"),
#"Cambiar nombre de columnas" = Table.RenameColumns(Origen,{{"referencia", "ID Referencia"}, {"cantidad", "Existencias"}}),
#"Anexar [INVENTARIO_TRANSITO_KANCAN]" = Table.Combine({#"Cambiar nombre de columnas", INVENTARIO_TRANSITO_KANCAN}),
#"Agrupar @ID Referencia" = Table.Group(#"Anexar [INVENTARIO_TRANSITO_KANCAN]", {"ID Referencia", "nombre_bodent"}, {{"Existencias", each List.Sum([Existencias]), type number}}),
#"Agregar @Almacen" = Table.AddColumn(#"Agrupar @ID Referencia", "Bodega", each "Transito"),
#"Renombrar @BodegaDestino" = Table.RenameColumns(#"Agregar @Almacen",{{"nombre_bodent", "Bodega Destino"}}),
#"Valor reemplazado" = Table.ReplaceValue(#"Renombrar @BodegaDestino","UNICO CALI - BODEGA","UNICO CALI",Replacer.ReplaceText,{"Bodega Destino"})
in
#"Valor reemplazado"

---

let
Origen = Odbc.Query("Driver={MySQL ODBC 8.0 ANSI Driver}; Server={192.168.19.250}; Database={naranka}", "SELECT#(lf)#(tab)ref.\*#(lf)FROM#(lf)#(tab)naranka.referencias AS ref#(lf)ORDER BY#(lf)#(tab)ref.referencia"),
#"Seleccionar columnas" = Table.SelectColumns(Origen,{"codigo_barra", "referencia", "descripcion", "grupo", "codigo_homogeneo", "proveedor", "costo_promedio", "ultimo_costo", "precio_venta", "descuento", "nivel_referencia", "nivel_talla", "nivel_color", "precio_venta2", "fecha_creacion", "codigo_barra_num"}),
#"Dividir columna por delimitador" = Table.SplitColumn(#"Seleccionar columnas", "grupo", Splitter.SplitTextByDelimiter(" ", QuoteStyle.Csv), {"Grupo", "Subgrupo"}),
#"Cambiar nombre de columnas" = Table.RenameColumns(#"Dividir columna por delimitador",{{"referencia", "ID"}, {"codigo_barra", "Codigo Barras"}, {"descripcion", "Descripcion"}, {"codigo_homogeneo", "ID Grupo Homogeneo"}, {"proveedor", "ID Proveedor"}, {"costo_promedio", "Costo Promedio"}, {"ultimo_costo", "Ultimo Costo"}, {"precio_venta", "Precio 1"}, {"descuento", "Descuento"}, {"nivel_referencia", "Codigo"}, {"nivel_talla", "Talla"}, {"nivel_color", "Color"}, {"precio_venta2", "Precio 2"}, {"fecha_creacion", "Fecha Creacion"}, {"codigo_barra_num", "Codigo Corto"}}),
#"Agregar @Raiz" = Table.AddColumn(#"Cambiar nombre de columnas", "Raiz", each Text.Range([ID], 0, 14)),
#"Reemplazar texto en @Codigo Barras" = Table.ReplaceValue(#"Agregar @Raiz","-","",Replacer.ReplaceText,{"Codigo Barras"}),
#"Cambiar tipo de datos" = Table.TransformColumnTypes(#"Reemplazar texto en @Codigo Barras",{{"Codigo Barras", Int64.Type}, {"Grupo", Int64.Type}, {"Subgrupo", Int64.Type}, {"Codigo", Int64.Type}}),
#"Reordenar columnas" = Table.ReorderColumns(#"Cambiar tipo de datos",{"ID", "Codigo Barras", "Codigo Corto", "Grupo", "Subgrupo", "Codigo", "Talla", "Color", "Descripcion", "ID Proveedor", "Costo Promedio", "Ultimo Costo", "Precio 1", "Precio 2", "Fecha Creacion", "Raiz", "ID Grupo Homogeneo", "Descuento"}),
#"Consultas combinadas" = Table.NestedJoin(#"Reordenar columnas", {"Subgrupo"}, GRUPOS_HOMOGENEOS, {"ID"}, "GRUPOS_HOMOGENEOS", JoinKind.LeftOuter),
#"Se expandió GRUPOS_HOMOGENEOS" = Table.ExpandTableColumn(#"Consultas combinadas", "GRUPOS_HOMOGENEOS", {"Nombre"}, {"GRUPOS_HOMOGENEOS.Nombre"})
in
#"Se expandió GRUPOS_HOMOGENEOS"

---

let
Origen = Odbc.Query("Driver={MySQL ODBC 8.0 ANSI Driver}; Server={192.168.19.250}; Database={naranka}", "SELECT#(lf)#(tab)exis.referencia AS 'ID Referencia',#(lf)#(tab)exis.existencia AS 'Existencias',#(lf)#(tab)exis.nombre_bodega AS 'Bodega'#(lf)FROM#(lf)#(tab)kcn_db.existencias_2026 AS exis#(lf)WHERE#(lf)#(tab)exis.bodega BETWEEN 3 AND 20#(lf)#(tab)#(lf)UNION ALL#(lf)#(lf)SELECT#(lf)#(tab)exis.referencia AS 'ID Referencia',#(lf)#(tab)exis.existencia AS 'Existencias',#(lf)#(tab)exis.nombre_bodega AS 'Bodega'#(lf)FROM#(lf)#(tab)naranka.existencias_2026 AS exis#(lf)WHERE#(lf)#(tab)exis.bodega BETWEEN 3 AND 40#(lf)#(tab)OR exis.bodega = 77#(lf)#(tab)OR exis.bodega = 94#(lf)#(tab)OR exis.bodega = 107"),
#"Consulta anexada" = Table.Combine({Origen, INVENTARIO_TRANSITO}),
#"Valor reemplazado" = Table.ReplaceValue(#"Consulta anexada","UNICO CALI - BODEGA","UNICO CALI",Replacer.ReplaceText,{"Bodega"}),
#"Valor reemplazado1" = Table.ReplaceValue(#"Valor reemplazado","- -","-",Replacer.ReplaceText,{"ID Referencia"})
in
#"Valor reemplazado1"

---

let
Origen = Odbc.Query("Driver={MySQL ODBC 8.0 ANSI Driver}; Server={192.168.19.250}; Database={naranka}", "#(lf)#(lf)SELECT#(lf) codigo_referencia AS 'ID Referencia',#(lf) documentos AS 'ID Factura',#(lf) fecdoc AS 'Fecha Factura',#(lf) nombre_vendedor AS 'Asesor',#(lf) nombre_bodega AS 'Bodega',#(lf) SUM(venta) AS 'Venta',#(lf) SUM(valor) AS 'Valor'#(lf)FROM (#(lf) SELECT#(lf) vent.codigo_referencia,#(lf) vent.documentos,#(lf) vent.fecdoc,#(lf) nombre_vendedor,#(lf) vent.nombre_bodega,#(lf) ROUND(vent.cantidad_venta, 0) AS 'venta',#(lf) ROUND(vent.total_factura, 0) AS 'valor'#(lf) FROM#(lf) kcn_db.ventas_2025 AS vent#(lf) WHERE#(lf) vent.bodega BETWEEN 3 AND 20#(lf) #(lf) UNION ALL#(lf) #(lf) SELECT#(lf) dev.codigo_referencia,#(lf) dev.documentos,#(lf) dev.fecdoc,#(lf) nombre_vendedor,#(lf) dev.nombre_bodega,#(lf) -1 _ ROUND(dev.cantidad, 0) AS 'venta',#(lf) -1 _ ROUND(dev.total_factura, 0) AS 'valor' #(lf) FROM#(lf) kcn_db.devoluciones_2025 AS dev#(lf) WHERE#(lf) dev.bodega BETWEEN 3 AND 20#(lf)) AS ventas_kancan#(lf)#(lf)GROUP BY #(lf) codigo_referencia,#(lf) documentos,#(lf) fecdoc,#(lf) nombre_vendedor,#(lf) nombre_bodega#(lf)#(lf)UNION ALL#(lf)#(lf)SELECT#(lf) codigo_referencia AS 'ID Referencia',#(lf) documentos AS 'ID Factura',#(lf) fecdoc AS 'Fecha Factura',#(lf) nombre_vendedor AS 'Asesor',#(lf) nombre_bodega AS 'Bodega',#(lf) SUM(venta) AS 'Venta',#(lf) SUM(valor) AS 'Valor'#(lf)FROM (#(lf) SELECT#(lf) vent.codigo_referencia,#(lf) vent.documentos,#(lf) vent.fecdoc,#(lf) nombre_vendedor,#(lf) vent.nombre_bodega,#(lf) ROUND(vent.cantidad_venta, 0) AS 'venta',#(lf) ROUND(vent.total_factura, 0) AS 'valor'#(lf) FROM#(lf) naranka.ventas_2025 AS vent#(lf) WHERE#(lf) vent.bodega BETWEEN 3 AND 40#(lf) #(lf) UNION ALL#(lf) #(lf) SELECT#(lf) dev.codigo_referencia,#(lf) dev.documentos,#(lf) dev.fecdoc,#(lf) nombre_vendedor,#(lf) dev.nombre_bodega,#(lf) -1 _ ROUND(dev.cantidad, 0) AS 'venta',#(lf) -1 _ ROUND(dev.total_factura, 0) AS 'valor' #(lf) FROM#(lf) naranka.devoluciones_2025 AS dev#(lf) WHERE#(lf) dev.bodega BETWEEN 3 AND 40#(lf)) AS ventas_naranka#(lf)#(lf)#(lf)GROUP BY #(lf) codigo_referencia,#(lf) documentos,#(lf) fecdoc,#(lf) nombre_vendedor,#(lf) nombre_bodega#(lf)#(lf)UNION ALL#(lf)#(lf)SELECT#(lf) codigo_referencia AS 'ID Referencia',#(lf) documentos AS 'ID Factura',#(lf) fecdoc AS 'Fecha Factura',#(lf) nombre_vendedor,#(lf) nombre_bodega AS 'Bodega',#(lf) SUM(venta) AS 'Venta',#(lf) SUM(valor) AS 'Valor'#(lf)FROM (#(lf) SELECT#(lf) vent.codigo_referencia,#(lf) vent.documentos,#(lf) vent.fecdoc,#(lf) nombre_vendedor,#(lf) vent.nombre_bodega,#(lf) ROUND(vent.cantidad_venta, 0) AS 'venta',#(lf) ROUND(vent.total_factura, 0) AS 'valor'#(lf) FROM#(lf) kcn_db.ventas_2026 AS vent#(lf) WHERE#(lf) vent.bodega BETWEEN 3 AND 20#(lf) #(lf) UNION ALL#(lf) #(lf) SELECT#(lf) dev.codigo_referencia,#(lf) dev.documentos,#(lf) dev.fecdoc,#(lf) nombre_vendedor,#(lf) dev.nombre_bodega,#(lf) -1 _ ROUND(dev.cantidad, 0) AS 'venta',#(lf) -1 _ ROUND(dev.total_factura, 0) AS 'valor' #(lf) FROM#(lf) kcn_db.devoluciones_2026 AS dev#(lf) WHERE#(lf) dev.bodega BETWEEN 3 AND 20#(lf)) AS ventas_kancan#(lf)#(lf)GROUP BY #(lf) codigo_referencia,#(lf) documentos,#(lf) fecdoc,#(lf) nombre_vendedor,#(lf) nombre_bodega#(lf)#(lf)UNION ALL#(lf)#(lf)SELECT#(lf) codigo_referencia AS 'ID Referencia',#(lf) documentos AS 'ID Factura',#(lf) fecdoc AS 'Fecha Factura',#(lf) nombre_vendedor,#(lf) nombre_bodega AS 'Bodega',#(lf) SUM(venta) AS 'Venta',#(lf) SUM(valor) AS 'Valor'#(lf)FROM (#(lf) SELECT#(lf) vent.codigo_referencia,#(lf) vent.documentos,#(lf) vent.fecdoc,#(lf) nombre_vendedor,#(lf) vent.nombre_bodega,#(lf) ROUND(vent.cantidad_venta, 0) AS 'venta',#(lf) ROUND(vent.total_factura, 0) AS 'valor'#(lf) FROM#(lf) naranka.ventas_2026 AS vent#(lf) WHERE#(lf) vent.bodega BETWEEN 3 AND 40#(lf) #(lf) UNION ALL#(lf) #(lf) SELECT#(lf) dev.codigo_referencia,#(lf) dev.documentos,#(lf) dev.fecdoc,#(lf) nombre_vendedor,#(lf) dev.nombre_bodega,#(lf) -1 _ ROUND(dev.cantidad, 0) AS 'venta',#(lf) -1 _ ROUND(dev.total_factura, 0) AS 'valor' #(lf) FROM#(lf) naranka.devoluciones_2026 AS dev#(lf) WHERE#(lf) dev.bodega BETWEEN 3 AND 40#(lf)) AS ventas_naranka#(lf)#(lf)#(lf)GROUP BY #(lf) codigo_referencia,#(lf) documentos,#(lf) fecdoc,#(lf) nombre_bodega"),
#"Valor reemplazado" = Table.ReplaceValue(Origen,"- -","-",Replacer.ReplaceText,{"ID Referencia"})
in
#"Valor reemplazado"

---

let
Origen = Odbc.Query("Driver={MySQL ODBC 8.0 ANSI Driver}; Server={192.168.19.250}; Database={naranka}", "SELECT#(lf) codigo_referencia AS 'ID Referencia',#(lf) documentos AS 'ID Factura',#(lf) fecdoc AS 'Fecha Factura',#(lf) nombre_bodega AS 'Bodega',#(lf) SUM(venta) AS 'Venta',#(lf) SUM(valor) AS 'Valor'#(lf)FROM (#(lf) SELECT#(lf) vent.codigo_referencia,#(lf) vent.documentos,#(lf) vent.fecdoc,#(lf) vent.nombre_bodega,#(lf) ROUND(vent.cantidad_venta, 0) AS 'venta',#(lf) ROUND(vent.total_factura, 0) AS 'valor'#(lf) FROM#(lf) kcn_db.ventas_2025 AS vent#(lf) WHERE#(lf) vent.mes = 9#(lf) AND vent.bodega BETWEEN 3 AND 20#(lf) #(lf) UNION ALL#(lf) #(lf) SELECT#(lf) dev.codigo_referencia,#(lf) dev.documentos,#(lf) dev.fecdoc,#(lf) dev.nombre_bodega,#(lf) -1 _ ROUND(dev.cantidad, 0) AS 'venta',#(lf) -1 _ ROUND(dev.total_factura, 0) AS 'valor' #(lf) FROM#(lf) kcn_db.devoluciones_2025 AS dev#(lf) WHERE#(lf) dev.mes = 9#(lf) AND dev.bodega BETWEEN 3 AND 20#(lf)) AS ventas_kancan#(lf)#(lf)GROUP BY #(lf) codigo_referencia,#(lf) documentos,#(lf) fecdoc,#(lf) nombre_bodega#(lf)#(lf)UNION ALL#(lf)#(lf)SELECT#(lf) codigo_referencia AS 'ID Referencia',#(lf) documentos AS 'ID Factura',#(lf) fecdoc AS 'Fecha Factura',#(lf) nombre_bodega AS 'Bodega',#(lf) SUM(venta) AS 'Venta',#(lf) SUM(valor) AS 'Valor'#(lf)FROM (#(lf) SELECT#(lf) vent.codigo_referencia,#(lf) vent.documentos,#(lf) vent.fecdoc,#(lf) vent.nombre_bodega,#(lf) ROUND(vent.cantidad_venta, 0) AS 'venta',#(lf) ROUND(vent.total_factura, 0) AS 'valor'#(lf) FROM#(lf) naranka.ventas_2025 AS vent#(lf) WHERE#(lf) vent.mes = 9#(lf) AND vent.bodega BETWEEN 3 AND 40#(lf) #(lf) UNION ALL#(lf) #(lf) SELECT#(lf) dev.codigo_referencia,#(lf) dev.documentos,#(lf) dev.fecdoc,#(lf) dev.nombre_bodega,#(lf) -1 _ ROUND(dev.cantidad, 0) AS 'venta',#(lf) -1 _ ROUND(dev.total_factura, 0) AS 'valor' #(lf) FROM#(lf) naranka.devoluciones_2025 AS dev#(lf) WHERE#(lf) dev.mes = 9#(lf) AND dev.bodega BETWEEN 3 AND 40#(lf)) AS ventas_naranka#(lf)#(lf)#(lf)GROUP BY #(lf) codigo_referencia,#(lf) documentos,#(lf) fecdoc,#(lf) nombre_bodega")
in
Origen

---

let
Origen = Odbc.Query("Driver={MySQL ODBC 8.0 ANSI Driver}; Server={192.168.19.250}; Database={naranka}", "SELECT#(lf)#(tab)ref.\*#(lf)FROM#(lf)#(tab)naranka.referencias AS ref#(lf)ORDER BY#(lf)#(tab)ref.referencia"),
#"Seleccionar columnas" = Table.SelectColumns(Origen,{"codigo_barra", "referencia", "descripcion", "grupo", "codigo_homogeneo", "proveedor", "costo_promedio", "ultimo_costo", "precio_venta", "descuento", "nivel_referencia", "nivel_talla", "nivel_color", "precio_venta2", "fecha_creacion", "codigo_barra_num"}),
#"Dividir columna por delimitador" = Table.SplitColumn(#"Seleccionar columnas", "grupo", Splitter.SplitTextByDelimiter(" ", QuoteStyle.Csv), {"Grupo", "Subgrupo"}),
#"Cambiar nombre de columnas" = Table.RenameColumns(#"Dividir columna por delimitador",{{"referencia", "ID"}, {"codigo_barra", "Codigo Barras"}, {"descripcion", "Descripcion"}, {"codigo_homogeneo", "ID Grupo Homogeneo"}, {"proveedor", "ID Proveedor"}, {"costo_promedio", "Costo Promedio"}, {"ultimo_costo", "Ultimo Costo"}, {"precio_venta", "Precio 1"}, {"descuento", "Descuento"}, {"nivel_referencia", "Codigo"}, {"nivel_talla", "Talla"}, {"nivel_color", "Color"}, {"precio_venta2", "Precio 2"}, {"fecha_creacion", "Fecha Creacion"}, {"codigo_barra_num", "Codigo Corto"}}),
#"Agregar @Raiz" = Table.AddColumn(#"Cambiar nombre de columnas", "Raiz", each Text.Range([ID], 0, 14)),
#"Reemplazar texto en @Codigo Barras" = Table.ReplaceValue(#"Agregar @Raiz","-","",Replacer.ReplaceText,{"Codigo Barras"}),
#"Cambiar tipo de datos" = Table.TransformColumnTypes(#"Reemplazar texto en @Codigo Barras",{{"Codigo Barras", Int64.Type}, {"Grupo", Int64.Type}, {"Subgrupo", Int64.Type}, {"Codigo", Int64.Type}}),
#"Reordenar columnas" = Table.ReorderColumns(#"Cambiar tipo de datos",{"ID", "Codigo Barras", "Codigo Corto", "Grupo", "Subgrupo", "Codigo", "Talla", "Color", "Descripcion", "ID Proveedor", "Costo Promedio", "Ultimo Costo", "Precio 1", "Precio 2", "Fecha Creacion", "Raiz", "ID Grupo Homogeneo", "Descuento"})
in
#"Reordenar columnas"

---

let
Origen = Odbc.Query("Driver={MySQL ODBC 8.0 ANSI Driver}; Server={192.168.19.250}; Database={naranka}", "SELECT \*#(lf)FROM referencias_capsula"),
#"Columnas con nombre cambiado" = Table.RenameColumns(Origen,{{"id_referencia", "ID Referencia"}, {"id_capsula", "ID Capsula"}, {"unidades", "Unidades"}})
in
#"Columnas con nombre cambiado"

---

let
Origen = Odbc.Query("Driver={MySQL ODBC 8.0 ANSI Driver}; Server={192.168.19.250}; Database={naranka}", "SELECT \*#(lf)FROM capsulas"),
#"Columnas con nombre cambiado" = Table.RenameColumns(Origen,{{"id", "Id"}, {"nombre", "Nombre"}, {"coleccion", "Coleccion"}, {"fecha_inicio", "Fecha inicio"}, {"fecha_lanzamiento", "Fecha lanzamiento"}})
in
#"Columnas con nombre cambiado"

---

let
Origen = Odbc.Query("Driver={MySQL ODBC 8.0 ANSI Driver}; Server={192.168.19.250}; Database={naranka}", "SELECT \*#(lf)FROM grupos_homogeneos"),
#"Cambiar nombre de columnas" = Table.RenameColumns(Origen,{{"id", "ID"}, {"nombre", "Nombre"}, {"origen", "Origen"}, {"linea_venta", "Linea Venta"}, {"id_grupo", "ID Grupo"}})
in
#"Cambiar nombre de columnas"

---

let
Origen = Odbc.Query("Driver={MySQL ODBC 8.0 ANSI Driver}; Server={192.168.19.250}; Database={naranka}", "SELECT#(lf)#(tab)exis.referencia AS 'ID Referencia',#(lf)#(tab)exis.existencia AS 'Existencias',#(lf)#(tab)exis.nombre_bodega AS 'Bodega'#(lf)FROM#(lf)#(tab)kcn_db.existencias_2025 AS exis#(lf)WHERE#(lf)#(tab)exis.bodega BETWEEN 3 AND 20#(lf)#(tab)#(lf)UNION ALL#(lf)#(lf)SELECT#(lf)#(tab)exis.referencia AS 'ID Referencia',#(lf)#(tab)exis.existencia AS 'Existencias',#(lf)#(tab)exis.nombre_bodega AS 'Bodega'#(lf)FROM#(lf)#(tab)naranka.existencias_2025 AS exis#(lf)WHERE#(lf)#(tab)exis.bodega BETWEEN 3 AND 40#(lf)#(tab)OR exis.bodega = 77#(lf)#(tab)OR exis.bodega = 94#(lf)#(tab)OR exis.bodega = 107"),
#"Consulta anexada" = Table.Combine({Origen, #"INVENTARIO_TRANSITO (2)"}),
#"Valor reemplazado" = Table.ReplaceValue(#"Consulta anexada","UNICO CALI - BODEGA","UNICO CALI",Replacer.ReplaceText,{"Bodega"}),
#"Valor reemplazado1" = Table.ReplaceValue(#"Valor reemplazado","- -","-",Replacer.ReplaceText,{"ID Referencia"})
in
#"Valor reemplazado1"

---

let
Origen = Odbc.Query("Driver={MySQL ODBC 8.0 ANSI Driver}; Server={192.168.19.250}; Database={naranka}", "SELECT#(lf)#(tab)tras._#(lf)FROM#(lf)#(tab)naranka.traslados_2025 AS tras#(lf)WHERE#(lf)#(tab)tras.estado='Transito'#(lf)#(tab)AND tras.bodega_entra BETWEEN 3 AND 40#(lf)#(lf)UNION ALL#(lf)#(lf)SELECT#(lf)#(tab)tras._#(lf)FROM#(lf)#(tab)kcn_db.traslados_2025 AS tras#(lf)WHERE#(lf)#(tab)tras.estado='Transito'#(lf)#(tab)AND tras.bodega_entra > 900"),
#"Cambiar nombre de columnas" = Table.RenameColumns(Origen,{{"referencia", "ID Referencia"}, {"cantidad", "Existencias"}}),
#"Anexar [INVENTARIO_TRANSITO_KANCAN]" = Table.Combine({#"Cambiar nombre de columnas", #"INVENTARIO_TRANSITO_KANCAN (2)"}),
#"Agrupar @ID Referencia" = Table.Group(#"Anexar [INVENTARIO_TRANSITO_KANCAN]", {"ID Referencia"}, {{"Existencias", each List.Sum([Existencias]), type number}}),
#"Agregar @Almacen" = Table.AddColumn(#"Agrupar @ID Referencia", "Bodega", each "Transito"),
#"Valor reemplazado" = Table.ReplaceValue(#"Agregar @Almacen","UNICO CALI - BODEGA","UNICO CALI",Replacer.ReplaceText,{"Bodega"})
in
#"Valor reemplazado"

---

let
Origen = Odbc.Query("Driver={MySQL ODBC 8.0 ANSI Driver}; Server={192.168.19.250}; Database={kcn_db}", "SELECT#(lf)#(tab)tras._#(lf)FROM#(lf)#(tab)kcn_db.traslados_2025 AS tras#(lf)WHERE#(lf)#(tab)tras.estado='Transito'#(lf)#(tab)AND tras.bodega_entra BETWEEN 3 AND 20#(lf)#(lf)UNION ALL#(lf)#(lf)SELECT#(lf)#(tab)tras._#(lf)FROM#(lf)#(tab)naranka.traslados_2025 AS tras#(lf)WHERE#(lf)#(tab)tras.estado='Transito'#(lf)#(tab)AND tras.bodega_entra > 900"),
#"Cambiar nombre de columnas" = Table.RenameColumns(Origen,{{"referencia", "ID Referencia"}, {"cantidad", "Existencias"}})
in
#"Cambiar nombre de columnas"

---

let
Origen = Odbc.Query("Driver={MySQL ODBC 8.0 ANSI Driver}; Server={192.168.19.250}; Database={naranka}", "SELECT#(lf) codigo_referencia AS 'ID Referencia',#(lf) documentos AS 'ID Factura',#(lf) fecdoc AS 'Fecha Factura',#(lf) nombre_bodega AS 'Bodega',#(lf) SUM(venta) AS 'Venta',#(lf) SUM(valor) AS 'Valor'#(lf)FROM (#(lf) SELECT#(lf) vent.codigo_referencia,#(lf) vent.documentos,#(lf) vent.fecdoc,#(lf) vent.nombre_bodega,#(lf) ROUND(vent.cantidad_venta, 0) AS 'venta',#(lf) ROUND(vent.total_factura, 0) AS 'valor'#(lf) FROM#(lf) kcn_db.ventas_2025 AS vent#(lf) WHERE#(lf) vent.bodega BETWEEN 3 AND 20#(lf) #(lf) UNION ALL#(lf) #(lf) SELECT#(lf) dev.codigo_referencia,#(lf) dev.documentos,#(lf) dev.fecdoc,#(lf) dev.nombre_bodega,#(lf) -1 _ ROUND(dev.cantidad, 0) AS 'venta',#(lf) -1 _ ROUND(dev.total_factura, 0) AS 'valor' #(lf) FROM#(lf) kcn_db.devoluciones_2025 AS dev#(lf) WHERE#(lf) dev.bodega BETWEEN 3 AND 20#(lf)) AS ventas_kancan#(lf)#(lf)GROUP BY #(lf) codigo_referencia,#(lf) documentos,#(lf) fecdoc,#(lf) nombre_bodega#(lf)#(lf)UNION ALL#(lf)#(lf)SELECT#(lf) codigo_referencia AS 'ID Referencia',#(lf) documentos AS 'ID Factura',#(lf) fecdoc AS 'Fecha Factura',#(lf) nombre_bodega AS 'Bodega',#(lf) SUM(venta) AS 'Venta',#(lf) SUM(valor) AS 'Valor'#(lf)FROM (#(lf) SELECT#(lf) vent.codigo_referencia,#(lf) vent.documentos,#(lf) vent.fecdoc,#(lf) vent.nombre_bodega,#(lf) ROUND(vent.cantidad_venta, 0) AS 'venta',#(lf) ROUND(vent.total_factura, 0) AS 'valor'#(lf) FROM#(lf) naranka.ventas_2025 AS vent#(lf) WHERE#(lf) vent.bodega BETWEEN 3 AND 40#(lf) #(lf) UNION ALL#(lf) #(lf) SELECT#(lf) dev.codigo_referencia,#(lf) dev.documentos,#(lf) dev.fecdoc,#(lf) dev.nombre_bodega,#(lf) -1 _ ROUND(dev.cantidad, 0) AS 'venta',#(lf) -1 _ ROUND(dev.total_factura, 0) AS 'valor' #(lf) FROM#(lf) naranka.devoluciones_2025 AS dev#(lf) WHERE#(lf) dev.bodega BETWEEN 3 AND 40#(lf)) AS ventas_naranka#(lf)#(lf)#(lf)GROUP BY #(lf) codigo_referencia,#(lf) documentos,#(lf) fecdoc,#(lf) nombre_bodega"),
#"Valor reemplazado" = Table.ReplaceValue(Origen,"- -","-",Replacer.ReplaceText,{"ID Referencia"})
in
#"Valor reemplazado"
