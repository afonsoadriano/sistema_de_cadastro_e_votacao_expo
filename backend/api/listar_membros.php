<?php
$origens_permitidas = [
    "http://172.20.10.2:3002",
    "http://localhost",  // 🔁 o teu IP
];

$origem = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origem, $origens_permitidas)) {
    header("Access-Control-Allow-Origin: $origem");
}

header("Content-Type: application/json");

require_once '../config/db.php';

$id = intval($_GET['id'] ?? 0);
if (!$id) { echo json_encode(["success" => false]); exit; }

$stmt = $pdo->prepare("SELECT nome, email FROM membros WHERE projecto_id = ?");
$stmt->execute([$id]);
echo json_encode(["success" => true, "data" => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
?>