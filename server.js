import express from "express";
import cors from "cors";
import fs from "fs";
import multer from "multer";
import path from "path";

const app = express();
app.use(
  cors({
    origin: [
      "https://uniform-pal.vercel.app/",
      "https://localhost:5173"
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  })
);


app.use(express.json());
app.use(express.urlencoded({ extended: true }))
app.use("/uploads", express.static("uploads"));

// ✅ Ensure folders exist
if (!fs.existsSync("uploads")) fs.mkdirSync("uploads");
if (!fs.existsSync("data")) fs.mkdirSync("data");
const dataFile = "data/uniforms.json";
if (!fs.existsSync(dataFile)) fs.writeFileSync(dataFile, "[]");

// ✅ Multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads"),
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

// ✅ Test route
app.get("/", (req, res) => {
  res.send("✅ Backend running fine!");
});

// ✅ Health check route for Render
app.get("/healthz", (req, res) => {
  res.status(200).send("OK");
});

// ✅ Get all uniforms
app.get("/uniforms", (req, res) => {
  const data = JSON.parse(fs.readFileSync(dataFile, "utf8"));
  res.json(data);
});

// ✅ Add a uniform
app.post(
  "/add-uniform",
  upload.fields([
    { name: "uniformImage", maxCount: 1 },
    { name: "compoundImage", maxCount: 1 },
    { name: "churchImage", maxCount: 1 },
  ]),
  (req, res) => {
    const {
      school,
      schoolType,
      uniformCombo,
      compoundWear,
      churchWear,
    } = req.body;

    const uniformImage = req.files?.uniformImage
      ? `/uploads/${req.files.uniformImage[0].filename}`
      : null;
    const compoundImage = req.files?.compoundImage
      ? `/uploads/${req.files.compoundImage[0].filename}`
      : null;
    const churchImage = req.files?.churchImage
      ? `/uploads/${req.files.churchImage[0].filename}`
      : null;

    if (!school || !uniformCombo) {
      return res.status(400).json({
        message: "School name and uniform combination are required.",
      });
    }

    const uniforms = JSON.parse(fs.readFileSync(dataFile, "utf8"));
    const newUniform = {
      id: Date.now().toString(),
      school,
      schoolType,
      uniformCombo,
      uniformImage,
      compoundWear,
      compoundImage,
      churchWear,
      churchImage,
    };

    uniforms.push(newUniform);
    fs.writeFileSync(dataFile, JSON.stringify(uniforms, null, 2));

    console.log("✅ Added new uniform:", newUniform);
    res.json({ message: "Uniform added successfully!", data: newUniform });
  }
);

// ✅ Delete a uniform
app.delete("/delete-uniform/:id", (req, res) => {
  const id = req.params.id;
  const uniforms = JSON.parse(fs.readFileSync(dataFile, "utf8"));

  const updated = uniforms.filter((u) => u.id !== id);
  if (updated.length === uniforms.length)
    return res.status(404).json({ message: "Uniform not found" });

  fs.writeFileSync(dataFile, JSON.stringify(updated, null, 2));
  console.log("🗑 Deleted:", id);
  res.json({ message: "Uniform deleted successfully!" });
});

// ✅ Update a uniform
app.put(
  "/update-uniform/:id",
  upload.fields([
    { name: "uniformImage", maxCount: 1 },
    { name: "compoundImage", maxCount: 1 },
    { name: "churchImage", maxCount: 1 },
  ]),
  (req, res) => {
    try {
      const id = req.params.id;
      const uniforms = JSON.parse(fs.readFileSync(dataFile, "utf8"));
      const index = uniforms.findIndex((u) => u.id === id);
      if (index === -1)
        return res.status(404).json({ message: "Uniform not found" });

      const old = uniforms[index];
      const updated = {
        ...old,
        ...req.body,
        uniformImage:
          req.files?.uniformImage?.[0]
            ? `/uploads/${req.files.uniformImage[0].filename}`
            : old.uniformImage,
        compoundImage:
          req.files?.compoundImage?.[0]
            ? `/uploads/${req.files.compoundImage[0].filename}`
            : old.compoundImage,
        churchImage:
          req.files?.churchImage?.[0]
            ? `/uploads/${req.files.churchImage[0].filename}`
            : old.churchImage,
      };

      uniforms[index] = updated;
      fs.writeFileSync(dataFile, JSON.stringify(uniforms, null, 2));
      console.log("✅ Updated uniform:", updated);
      res.json({ message: "Uniform updated successfully!", data: updated });
    } catch (err) {
      console.error("❌ Update error:", err);
      res.status(500).json({ message: "Server error while updating uniform." });
    }
  }
);

// ✅ Use Render’s dynamic port (instead of hardcoded 5000)
const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});






