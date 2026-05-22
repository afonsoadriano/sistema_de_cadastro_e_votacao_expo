<?php
$origens_permitidas = [
    "http://172.20.10.2:3002",
    "http://localhost",  // 🔁 o teu IP
];

$origem = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origem, $origens_permitidas)) {
    header("Access-Control-Allow-Origin: $origem");
}

header("Access-Control-Allow-Methods: DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(0); }

require_once '../config/db.php';

$data = json_decode(file_get_contents("php://input"), true);
$id   = intval($data['id'] ?? 0);

if (!$id) {
    echo json_encode(["success" => false, "message" => "ID inválido."]);
    exit;
}

try {
    $pdo->prepare("DELETE FROM projectos WHERE id = ?")->execute([$id]);
    echo json_encode(["success" => true, "message" => "Projecto eliminado!"]);
} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
?>