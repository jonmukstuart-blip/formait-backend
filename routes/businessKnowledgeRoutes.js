import express from "express";
import BusinessKnowledge from "../models/BusinessKnowledge.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);

// GET BUSINESS KNOWLEDGE
router.get("/", async (req, res) => {
    try {
        const records = await BusinessKnowledge.find({
            tenantId: req.tenantId
        }).sort({
            priority: -1,
            updatedAt: -1
        });

        res.json(records);

    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
});

// CREATE
router.post("/", async (req, res) => {
    try {
        const record = await BusinessKnowledge.create({
            tenantId: req.tenantId,
            category: req.body.category,
            title: req.body.title,
            content: req.body.content,
            keywords: req.body.keywords || [],
            priority: req.body.priority || 0,
            active: req.body.active !== false
        });

        res.status(201).json(record);

    } catch (error) {
        res.status(400).json({
            error: error.message
        });
    }
});

// UPDATE
router.put("/:id", async (req, res) => {
    try {
        const record =
            await BusinessKnowledge.findOneAndUpdate(
                {
                    _id: req.params.id,
                    tenantId: req.tenantId
                },
                {
                    $set: {
                        category: req.body.category,
                        title: req.body.title,
                        content: req.body.content,
                        keywords: req.body.keywords,
                        priority: req.body.priority,
                        active: req.body.active
                    }
                },
                {
                    new: true,
                    runValidators: true
                }
            );

        if (!record) {
            return res.status(404).json({
                error: "Knowledge record not found"
            });
        }

        res.json(record);

    } catch (error) {
        res.status(400).json({
            error: error.message
        });
    }
});

// DELETE
router.delete("/:id", async (req, res) => {
    try {
        const record =
            await BusinessKnowledge.findOneAndDelete({
                _id: req.params.id,
                tenantId: req.tenantId
            });

        if (!record) {
            return res.status(404).json({
                error: "Knowledge record not found"
            });
        }

        res.json({
            success: true
        });

    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
});

export default router;