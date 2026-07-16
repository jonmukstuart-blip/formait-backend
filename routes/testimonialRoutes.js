import express from "express";
import crypto from "crypto";
import Testimonial from "../models/Testimonial.js";
import { protect } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";

const router = express.Router();


// ========================================================
// GET ALL TESTIMONIALS (Admin)
// ========================================================
router.get("/", protect, async (req, res) => {
    try {
        const testimonials = await Testimonial.find().sort({ createdAt: -1 });

        res.json(testimonials);

    } catch (err) {

        res.status(500).json({
            error: err.message
        });

    }
});


// ========================================================
// GET ONE TESTIMONIAL USING REVIEW TOKEN (Public)
// ========================================================
router.get("/by-project/:projectTitle", async (req, res) => {
    try {

        const testimonial = await Testimonial.findOne({
            projectTitle: decodeURIComponent(req.params.projectTitle)
        });

        if (!testimonial) {
            return res.status(404).json({ error: "Review link not found." });
        }

        res.json(testimonial);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// ========================================================
// CLIENT SUBMITS REVIEW
// ========================================================
router.post("/", upload.single("media"), async (req, res) => {
    try {
  const testimonial = await Testimonial.create({
    projectId: req.body.projectId,
    projectTitle: req.body.projectTitle,
    clientName: req.body.clientName,
    company: req.body.company,
    position: req.body.position,
    testimonial: req.body.testimonial,
    rating: req.body.rating,
    status: "pending",
    media: req.file ? req.file.filename : null
});
        res.json(testimonial);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post("/generate", (req, res) => {
    try {
        const { projectId, projectTitle } = req.body;

        if (!projectId || !projectTitle) {
            return res.status(400).json({
                error: "Missing projectId or projectTitle"
            });
        }
const url =
`https://formaitgroup.com/testimonial.html?projectId=${projectId}&project=${encodeURIComponent(projectTitle)}`;

        console.log("GENERATED URL:", url);

        return res.json({ url });

    } catch (err) {
        console.error("Generate error:", err);
        return res.status(500).json({ error: err.message });
    }
});

// ========================================================
// APPROVE TESTIMONIAL
// ========================================================
router.put("/:id/approve", protect, async (req, res) => {

    try {

        const testimonial = await Testimonial.findByIdAndUpdate(

            req.params.id,

            {
                approved: true
            },

            {
                new: true
            }

        );

        res.json(testimonial);

    } catch (err) {

        res.status(500).json({
            error: err.message
        });

    }

});

router.get("/review/:token", async (req, res) => {
  const link = await TestimonialLink.findOne({ token: req.params.token });

  if (!link) return res.status(404).send("Invalid link");

  res.redirect(`http://127.0.0.1:5500/testimonial.html?project=${encodeURIComponent(link.projectTitle)}`);
});
// ========================================================
// DELETE TESTIMONIAL
// ========================================================
router.delete("/:id", protect, async (req, res) => {

    try {

        await Testimonial.findByIdAndDelete(req.params.id);

        res.json({
            success: true
        });

    } catch (err) {

        res.status(500).json({
            error: err.message
        });

    }

});

export default router;