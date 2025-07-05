<?php
require_once '../config.php';

// Solo permitir método POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse(['success' => false, 'message' => 'Método no permitido'], 405);
}

try {
    session_start();
    
    // Destruir la sesión
    session_destroy();
    
    sendResponse([
        'success' => true,
        'message' => 'Sesión cerrada exitosamente'
    ]);

} catch (Exception $e) {
    sendResponse(['success' => false, 'message' => 'Error al cerrar sesión: ' . $e->getMessage()], 500);
}
?>