import mongoose from "mongoose";

const testimonialLinkSchema = new mongoose.Schema(
  {
    token: {
      type: String,
      required: true,
      unique: true
    },

    projectTitle: String,
    clientName: String,
    company: String,
    position: String,

    used: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

export default mongoose.model("TestimonialLink", testimonialLinkSchema);