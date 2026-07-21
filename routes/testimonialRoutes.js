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
// GET APPROVED PORTFOLIO TESTIMONIALS (Public)
// ========================================================
router.get("/approved", async (req, res) => {
    try {
        const testimonials = await Testimonial.find({
            status: "approved"
        })
        .populate("projectId")
        .sort({ createdAt: -1 });

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
router.post("/", (req, res) => {
    upload.single("media")(req, res, async uploadError => {
        if (uploadError) {
            console.error(
                "[TESTIMONIAL UPLOAD ERROR]",
                uploadError
            );

            return res.status(400).json({
                success: false,
                error:
                    uploadError.message ||
                    "Media upload failed."
            });
        }

        try {
            const {
                projectId,
                projectTitle,
                clientName,
                company,
                position,
                testimonial,
                rating
            } = req.body;

            if (
                !projectId ||
                !projectTitle ||
                !clientName ||
                !testimonial
            ) {
                return res.status(400).json({
                    success: false,
                    error:
                        "Project, client name and testimonial are required."
                });
            }

            const createdTestimonial =
                await Testimonial.create({
                    projectId,
                    projectTitle,
                    clientName,
                    company: company || "",
                    position: position || "",
                    testimonial,
                    rating: Number(rating) || 5,
                    status: "pending",
                    media: req.file?.path || null
                });

            return res.status(201).json({
                success: true,
                data: createdTestimonial
            });

        } catch (error) {
            console.error(
                "[TESTIMONIAL DATABASE ERROR]",
                error
            );

            return res.status(500).json({
                success: false,
                error:
                    error.message ||
                    "Testimonial submission failed."
            });
        }
    });
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
                status: "approved"
            },
            {
                new: true,
                runValidators: true
            }
        );

        if (!testimonial) {
            return res.status(404).json({
                error: "Testimonial not found."
            });
        }

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