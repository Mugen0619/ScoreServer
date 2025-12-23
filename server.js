// ================================
// 必要なモジュール
// ================================
const express = require("express");
const cors = require("cors");
const app = express();
const port = 3000;

// ★ MongoDB ドライバを読み込み
const { MongoClient } = require("mongodb");

// ★ MongoDB Atlas の接続文字列
require("dotenv").config();
const uri = process.env.MONGO_URI;
// ★ MongoDB クライアント作成
const client = new MongoClient(uri);

// ================================
// DB 接続関数（scores コレクションを返す）
// ================================
async function getScoresCollection() {
    try {
        // ★ 新しいドライバでは topology が無いので、Promise を使って接続管理
        if (!client._connectionPromise) {
            client._connectionPromise = client.connect();
        }
        await client._connectionPromise;

        return client.db("gameDB").collection("scores");

    } catch (err) {
        console.error("MongoDB 接続エラー:", err);
        return null;
    }
}

// ================================
// ミドルウェア設定
// ================================
app.use(express.json());
app.use(cors());

// ================================
// スコア保存 API（POST /score）
// ================================
app.post("/score", async (req, res) => {
    const { player, score } = req.body;

    try {
        const scores = await getScoresCollection();
        if (!scores) return res.status(500).json({ error: "DB接続失敗" });

        const newScore = {
            player,
            score,
            time: new Date().toISOString()
        };

        await scores.insertOne(newScore);

        console.log(`[SAVE] ${player} : ${score}`);
        res.json({ status: "ok", saved: true, data: newScore });

    } catch (err) {
        console.error("スコア保存エラー:", err);
        res.status(500).json({ status: "error" });
    }
});

// ================================
// ランキング取得 API（GET /ranking）
// ================================
app.get("/ranking", async (req, res) => {
    try {
        const scores = await getScoresCollection();
        if (!scores) return res.status(500).json({ error: "DB接続失敗" });

        const ranking = await scores
            .find({})
            .sort({ score: -1 })
            .limit(20)
            .toArray();

        res.json(ranking);

    } catch (err) {
        console.error("ランキング読み込みエラー:", err);
        res.status(500).json({ status: "error" });
    }
});

// ================================
// サーバー起動
// ================================
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});