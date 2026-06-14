import mongoose from "mongoose";

const activitySchema = new mongoose.Schema(
    {
        type: String, // call, email, note, status_change
        message: String,

        lead: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Lead"
        },

        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    },
    { timestamps: true }
);

export default mongoose.model("Activity", activitySchema);