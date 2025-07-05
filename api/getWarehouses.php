<?php
require_once '../config.php';

try {
    $pdo = getDBConnection();
    
    // Obtener todos los almacenes
    $sql = "SELECT IdAlmacen as id, Nombre as name, Ubicacion as location 
            FROM Almacenes 
            ORDER BY Nombre";
    
    $stmt = $pdo->query($sql);
    $warehouses = $stmt->fetchAll();

    sendResponse([
        'success' => true,
        'data' => $warehouses
    ]);

} catch (Exception $e) {
    sendResponse([
        'success' => false,
        'message' => 'Error al obtener almacenes: ' . $e->getMessage()
    ], 500);
}
?>