import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const clientSchema = new mongoose.Schema({

    fullName: {
        type: String,
        required: true
    },

    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },

    password: {
        type: String,
        required: true
    },

    phone: {
        type: String,
        default: ""
    },

    company: {
        type: String,
        default: ""
    },

    jobTitle: {
        type: String,
        default: ""
    },

    country: {
        type: String,
        default: ""
    },

    avatar: {
        type: String,
        default: ""
    },

    lastLogin: {
        type: Date
    }

}, { timestamps: true });

clientSchema.pre("save", async function(next){

    if(!this.isModified("password")) return next();

    const salt = await bcrypt.genSalt(10);

    this.password = await bcrypt.hash(this.password, salt);

    next();

});

clientSchema.methods.comparePassword = function(password){

    return bcrypt.compare(password, this.password);

};

export default mongoose.model("Client", clientSchema);