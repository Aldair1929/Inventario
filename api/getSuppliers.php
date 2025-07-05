<?php
require_once '../config.php';

try {
    $pdo = getDBConnection();
    
    // Obtener todos los proveedores
    $sql = "SELECT IdProveedor as id, Nombre as name, Direccion as address, Telefono as phone 
            FROM Proveedores 
            ORDER BY Nombre";
    
    $stmt = $pdo->query($sql);
    $suppliers = $stmt->fetchAll();

    sendResponse([
        'success' => true,
        'data' => $suppliers
    ]);

} catch (Exception $e) {
    sendResponse([
        'success' => false,
        'message' => 'Error al obtener proveedores: ' . $e->getMessage()
    ], 500);
}
?>