import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },

        tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Tenant",
    default: null,
    index: true
},

        role: {
    type: String,
    enum: [
        "owner",
        "admin",
        "sales",
        "support",
        "user"
    ],
    default: "user",
    index: true
},
        role: {
            type: String,
            enum: ["admin", "sales", "user"],
            default: "user"
        }
    },

    { timestamps: true }
);

export default mongoose.model("User", userSchema);