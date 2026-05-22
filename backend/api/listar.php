<?php

$origens_permitidas = [
    "http://172.20.10.2:3002",
    "http://localhost",
];

$origem = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origem, $origens_permitidas)) {
    header("Access-Control-Allow-Origin: $origem");
}

header("Content-Type: application/json");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, OPTIONS");

require_once '../config/db.php';

try {
    $stmt = $pdo->query("
        SELECT 
            p.id,
            p.tema,
            p.area,
            p.orientador,
            p.necessidades,
            p.resumo,
            p.curso,
            p.turma,
            p.criado_em,

            COUNT(DISTINCT v.id) AS total_votos,

            GROUP_CONCAT(
                DISTINCT m.nome 
                SEPARATOR ', '
            ) AS membros_nomes,

            u.nome AS cadastrado_por

        FROM projectos p

        LEFT JOIN membros m 
        ON m.projecto_id = p.id

        LEFT JOIN usuarios u 
        ON u.id = p.usuario_id

        LEFT JOIN votos v 
        ON v.projecto_id = p.id

        GROUP BY p.id

        ORDER BY total_votos DESC, p.criado_em DESC
    ");
    $projectos = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(["success" => true, "data" => $projectos]);
} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
?>