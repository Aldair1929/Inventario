<?php
// Configuración de la base de datos SQL Server
define('DB_HOST', 'localhost');
define('DB_USER', 'sa');
define('DB_PASS', '');
define('DB_NAME', 'Sistema_Inventario');

// Configuración de la aplicación
define('APP_NAME', 'Sistema de Inventario Agrícola');
define('APP_VERSION', '1.0.0');

// Configuración de CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Manejar preflight requests
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit(0);
}

// Función para conectar a la base de datos SQL Server
function getDBConnection() {
    try {
        $dsn = "sqlsrv:Server=" . DB_HOST . ";Database=" . DB_NAME;
        $pdo = new PDO(
            $dsn,
            DB_USER,
            DB_PASS,
            [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
            ]
        );
        return $pdo;
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Error de conexión a la base de datos: ' . $e->getMessage()
        ]);
        exit;
    }
}

// Función para enviar respuesta JSON
function sendResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

// Función para validar datos de entrada
function validateInput($data, $requiredFields) {
    $errors = [];
    
    foreach ($requiredFields as $field) {
        if (!isset($data[$field]) || empty(trim($data[$field]))) {
            $errors[] = "El campo '$field' es requerido";
        }
    }
    
    return $errors;
}

// Función para sanitizar datos
function sanitizeInput($data) {
    if (is_array($data)) {
        return array_map('sanitizeInput', $data);
    }
    return htmlspecialchars(strip_tags(trim($data)), ENT_QUOTES, 'UTF-8');
}

// Función para convertir nombres de campos de español a inglés para compatibilidad con frontend
function convertFieldNames($data) {
    $fieldMap = [
        'IdProducto' => 'id',
        'Nombre' => 'name',
        'Descripcion' => 'description',
        'Precio' => 'price',
        'Stock' => 'stock',
        'IdCategoria' => 'category_id',
        'NombreCategoria' => 'category_name',
        'IdProveedor' => 'supplier_id',
        'NombreProveedor' => 'supplier_name',
        'NivelStock' => 'stock_level',
        'Unidad' => 'unit'
    ];
    
    if (is_array($data)) {
        $converted = [];
        foreach ($data as $key => $value) {
            $newKey = isset($fieldMap[$key]) ? $fieldMap[$key] : strtolower($key);
            $converted[$newKey] = is_array($value) ? convertFieldNames($value) : $value;
        }
        return $converted;
    }
    
    return $data;
}

// Función para autenticar usuario
function authenticateUser($username, $password) {
    try {
        $pdo = getDBConnection();
        $stmt = $pdo->prepare("SELECT * FROM Usuarios WHERE NombreUsuario = ?");
        $stmt->execute([$username]);
        $user = $stmt->fetch();
        
        if ($user && password_verify($password, $user['Contraseña'])) {
            return [
                'success' => true,
                'user' => [
                    'id' => $user['IdUsuario'],
                    'username' => $user['NombreUsuario'],
                    'role' => $user['Rol']
                ]
            ];
        }
        
        return ['success' => false, 'message' => 'Credenciales inválidas'];
    } catch (Exception $e) {
        return ['success' => false, 'message' => 'Error de autenticación: ' . $e->getMessage()];
    }
}

// Función para verificar sesión
function verifySession() {
    session_start();
    if (!isset($_SESSION['user_id'])) {
        sendResponse(['success' => false, 'message' => 'Sesión no válida'], 401);
    }
    return $_SESSION;
}
?>