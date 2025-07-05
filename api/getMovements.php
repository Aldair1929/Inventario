<?php
require_once '../config.php';

try {
    $pdo = getDBConnection();
    
    // Parámetros de consulta
    $product_id = isset($_GET['product_id']) ? (int)$_GET['product_id'] : 0;
    $limit = isset($_GET['limit']) ? min(100, max(1, (int)$_GET['limit'])) : 50;

    // Construir consulta base
    $sql = "SELECT 
                m.IdMovimiento as id,
                m.IdProducto as product_id,
                m.TipoMovimiento as movement_type,
                m.Cantidad as quantity,
                m.Fecha as date,
                p.Nombre as product_name
            FROM Movimientos m
            INNER JOIN Productos p ON m.IdProducto = p.IdProducto
            WHERE 1=1";
    
    $params = [];

    // Filtrar por producto si se especifica
    if ($product_id > 0) {
        $sql .= " AND m.IdProducto = ?";
        $params[] = $product_id;
    }

    // Ordenar por fecha descendente y limitar resultados
    $sql .= " ORDER BY m.Fecha DESC";
    
    // Agregar límite usando TOP en SQL Server
    $sql = "SELECT TOP $limit " . substr($sql, 7); // Remover el SELECT inicial y agregar TOP

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $movements = $stmt->fetchAll();

    sendResponse([
        'success' => true,
        'data' => $movements
    ]);

} catch (Exception $e) {
    sendResponse([
        'success' => false,
        'message' => 'Error al obtener movimientos: ' . $e->getMessage()
    ], 500);
}
?>