import mongoose from "mongoose";

const testimonialSchema = new mongoose.Schema({

    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Portfolio",
        required: true
    },

    projectTitle: {
        type: String,
        required: true
    },

    clientName: {
        type: String,
        required: true
    },

    company: {
        type: String,
        default: ""
    },

    position: {
        type: String,
        default: ""
    },

    testimonial: {
        type: String,
        required: true
    },

    rating: {
        type: Number,
        default: 5
    },

    status: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending"
    },

    media: {
        type: String,
        default: null
    }

}, {
    timestamps: true
});

export default mongoose.model("Testimonial", testimonialSchema);