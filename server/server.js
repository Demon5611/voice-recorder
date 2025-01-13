const express = require("express");
const multer = require("multer");
const cors = require("cors");

const app = express();
const PORT = 5000;

// Разрешить CORS
app.use(cors());

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

app.post("/upload", upload.single("audio"), (req, res) => {
  console.log("File received:", req.file);
  res.json({ message: "Audio uploaded successfully!" });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
