import mongoose from "mongoose";

const PortfolioSchema = new mongoose.Schema({

title:{
 type:String,
 required:true
},

client:{
 type:String,
 required:true
},

status:{
 type:String,
 default:"Published"
},

tags:[
{
type:String
}
],

imageUrl:{
type:String,
default:""
},

testimonialStatus:{
type:String,
default:"pending"
}

},{
timestamps:true
});
export default mongoose.model("Portfolio", PortfolioSchema);