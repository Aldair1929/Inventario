<?php
require_once '../config.php';

try {
    $pdo = getDBConnection();
    
    // Obtener todos los clientes
    $sql = "SELECT IdCliente as id, Nombre as name, Direccion as address, Telefono as phone 
            FROM Clientes 
            ORDER BY Nombre";
    
    $stmt = $pdo->query($sql);
    $clients = $stmt->fetchAll();

    sendResponse([
        'success' => true,
        'data' => $clients
    ]);

} catch (Exception $e) {
    sendResponse([
        'success' => false,
        'message' => 'Error al obtener clientes: ' . $e->getMessage()
    ], 500);
}
?>