import mongoose from "mongoose";

const leadSchema = new mongoose.Schema(
    {
        name: String,
        email: String,
        phone: String,

        status: {
            type: String,
            enum: ["new", "contacted", "qualified", "lost", "won"],
            default: "new"
        },

        source: String,

        assignedTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },

        notes: String
    },
    { timestamps: true }
);

export default mongoose.model("Lead", leadSchema);