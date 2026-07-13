import express from "express";
import Testimonial from "../models/Testimonial.js";
import { protect } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";

const router = express.Router();


// GET ALL TESTIMONIALS (ADMIN)
router.get("/", protect, async (req, res) => {
    const data = await Testimonial.find().sort({ createdAt: -1 });
    res.json(data);
});

// APPROVE
router.put("/:id/approve", protect, async (req, res) => {
    const updated = await Testimonial.findByIdAndUpdate(
        req.params.id,
        { status: "approved" },
        { new: true }
    );
    res.json(updated);
});


// REJECT
router.put("/:id/reject", protect, async (req, res) => {
    const updated = await Testimonial.findByIdAndUpdate(
        req.params.id,
        { status: "rejected" },
        { new: true }
    );
    res.json(updated);
});

router.delete("/:id", protect, async (req, res) => {

    await Testimonial.findByIdAndDelete(req.params.id);

    res.json({
        success: true
    });

});

export default router;