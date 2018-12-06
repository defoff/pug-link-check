import { Schema } from "mongoose";
import mongoose from "../database/mongoose";

let checkProcessSchema = new Schema({
    siteToCheck: String,
    linkToCheck: String
});

let CheckProcessModel = mongoose.model('CheckProcess', checkProcessSchema);

export default CheckProcessModel;