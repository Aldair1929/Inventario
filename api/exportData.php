<?php
require_once '../config.php';

try {
    $pdo = getDBConnection();
    
    // Obtener todos los datos para exportar
    $data = [];

    // Productos con información completa
    $productsStmt = $pdo->query("SELECT * FROM VistaProductosCompleta ORDER BY Nombre");
    $data['productos'] = $productsStmt->fetchAll();

    // Categorías
    $categoriesStmt = $pdo->query("SELECT * FROM Categorias ORDER BY Nombre");
    $data['categorias'] = $categoriesStmt->fetchAll();

    // Proveedores
    $suppliersStmt = $pdo->query("SELECT * FROM Proveedores ORDER BY Nombre");
    $data['proveedores'] = $suppliersStmt->fetchAll();

    // Almacenes
    $warehousesStmt = $pdo->query("SELECT * FROM Almacenes ORDER BY Nombre");
    $data['almacenes'] = $warehousesStmt->fetchAll();

    // Clientes
    $clientsStmt = $pdo->query("SELECT * FROM Clientes ORDER BY Nombre");
    $data['clientes'] = $clientsStmt->fetchAll();

    // Movimientos recientes (últimos 100)
    $movementsStmt = $pdo->query("
        SELECT TOP 100 
            m.*, 
            p.Nombre as NombreProducto 
        FROM Movimientos m 
        INNER JOIN Productos p ON m.IdProducto = p.IdProducto 
        ORDER BY m.Fecha DESC
    ");
    $data['movimientos'] = $movementsStmt->fetchAll();

    // Estadísticas
    $statsStmt = $pdo->query("SELECT * FROM ObtenerEstadisticasInventario()");
    $data['estadisticas'] = $statsStmt->fetch();

    // Agregar metadatos
    $data['metadata'] = [
        'fecha_exportacion' => date('Y-m-d H:i:s'),
        'version_sistema' => '1.0.0',
        'total_registros' => [
            'productos' => count($data['productos']),
            'categorias' => count($data['categorias']),
            'proveedores' => count($data['proveedores']),
            'almacenes' => count($data['almacenes']),
            'clientes' => count($data['clientes']),
            'movimientos' => count($data['movimientos'])
        ]
    ];

    sendResponse([
        'success' => true,
        'data' => $data
    ]);

} catch (Exception $e) {
    sendResponse([
        'success' => false,
        'message' => 'Error al exportar datos: ' . $e->getMessage()
    ], 500);
}
?>