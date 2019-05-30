import * as mongoose from 'mongoose';
import CheckProcess from '../interfaces/check-process.interface';

let checkProcessSchema = new mongoose.Schema({
    siteToCheck: String,
    linkToCheck: String
});

const checkProcessModel = mongoose.model<CheckProcess & mongoose.Document>('CheckProcess', checkProcessSchema);

export default checkProcessModel;