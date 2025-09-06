const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { exec } = require("child_process");

const router = express.Router();

const uploadDir = path.resolve("/tmp/uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const fileName = `${Date.now()}-${file.originalname}`;
    cb(null, fileName);
  },
});
const upload = multer({ storage: storage });

router.get("/", (req, res) => {
  return res.render("home");
});

router.post("/unlock", upload.single("pdf"), (req, res) => {
  if (!req.file) {
    return res
      .status(400)
      .json({ success: false, message: "No file uploaded." });
  }

  const inputPath = req.file.path;
  const outputPath = path.resolve(`/tmp/unlocked-${Date.now()}.pdf`);
  const password = req.body.password || "";

  const command = `qpdf --password=${password} --decrypt "${inputPath}" "${outputPath}"`;

  exec(command, (error) => {
    if (error) {
      console.error("qpdf error:", error);
      if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);

      return res.status(400).json({
        success: false,
        message:
          "PDF is strongly encrypted or qpdf failed. Check password or file.",
      });
    }

    const originalName = req.file.originalname;
    const ext = path.extname(originalName);
    const baseName = path.basename(originalName, ext);

    res.download(outputPath, `${baseName}-unlocked${ext}`, (err) => {
      try {
        if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
      } catch (cleanupError) {
        console.error("Cleanup error:", cleanupError);
      }

      if (err) console.error("Download error:", err);
    });
  });
});

module.exports = router;
