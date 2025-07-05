<?php
require_once '../config.php';

try {
    $pdo = getDBConnection();
    
    // Parámetros de consulta
    $search = isset($_GET['search']) ? sanitizeInput($_GET['search']) : '';
    $category = isset($_GET['category']) ? (int)$_GET['category'] : 0;
    $stock_level = isset($_GET['stock_level']) ? sanitizeInput($_GET['stock_level']) : '';
    $page = isset($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
    $limit = isset($_GET['limit']) ? min(100, max(1, (int)$_GET['limit'])) : 50;
    $offset = ($page - 1) * $limit;

    // Construir consulta base usando la vista
    $sql = "SELECT * FROM VistaProductosCompleta WHERE 1=1";
    $params = [];

    // Agregar filtros
    if (!empty($search)) {
        $sql .= " AND (Nombre LIKE ? OR Descripcion LIKE ?)";
        $params[] = "%$search%";
        $params[] = "%$search%";
    }

    if ($category > 0) {
        $sql .= " AND IdCategoria = ?";
        $params[] = $category;
    }

    if (!empty($stock_level)) {
        switch ($stock_level) {
            case 'low':
                $sql .= " AND Stock <= 5";
                break;
            case 'normal':
                $sql .= " AND Stock > 5 AND Stock <= 20";
                break;
            case 'high':
                $sql .= " AND Stock > 20";
                break;
        }
    }

    // Contar total de registros
    $countSql = "SELECT COUNT(*) as total FROM ($sql) as count_query";
    $countStmt = $pdo->prepare($countSql);
    $countStmt->execute($params);
    $total = $countStmt->fetch()['total'];

    // Agregar ordenamiento y paginación
    $sql .= " ORDER BY Nombre OFFSET ? ROWS FETCH NEXT ? ROWS ONLY";
    $params[] = $offset;
    $params[] = $limit;

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $products = $stmt->fetchAll();

    // Convertir nombres de campos para compatibilidad con frontend
    $products = array_map('convertFieldNames', $products);

    // Obtener estadísticas usando la función
    $statsQuery = "SELECT * FROM ObtenerEstadisticasInventario()";
    $statsStmt = $pdo->query($statsQuery);
    $stats = $statsStmt->fetch();

    // Obtener categorías para filtros
    $categoriesQuery = "SELECT IdCategoria as id, Nombre as name FROM Categorias ORDER BY Nombre";
    $categoriesStmt = $pdo->query($categoriesQuery);
    $categories = $categoriesStmt->fetchAll();

    sendResponse([
        'success' => true,
        'data' => $products,
        'pagination' => [
            'page' => $page,
            'limit' => $limit,
            'total' => (int)$total,
            'pages' => ceil($total / $limit)
        ],
        'stats' => [
            'total_products' => (int)$stats['TotalProductos'],
            'total_value' => (float)$stats['ValorTotal'],
            'low_stock_count' => (int)$stats['ProductosBajoStock'],
            'categories_count' => (int)$stats['TotalCategorias']
        ],
        'categories' => $categories
    ]);

} catch (Exception $e) {
    sendResponse([
        'success' => false,
        'message' => 'Error al obtener productos: ' . $e->getMessage()
    ], 500);
}
?>