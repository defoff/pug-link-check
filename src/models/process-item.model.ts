import * as mongoose from 'mongoose';
import ProcessItem from '../interfaces/process-item.interface';

const objId = new mongoose.Types.ObjectId();

const processItemSchema = new mongoose.Schema({
    _id                 : { type: String, default: objId.toHexString() },
    creationDate        : { type: Date, default: new Date() },
    editDates           : { type: [Date], default: [] },
    editDate            : { type: Date, default: null },
    editUsers           : { type: [String], default: [] },
    editUser            : { type: String, default: null },
    submissionDate      : { type: Date, default: null },
    submissionUser      : { type: String, default: null },

    status              : { type: String, default: 'open'},
    targetUrl           : { type: String },
    backlinkOriginUrl   : { type: String, default: '' },
});

const processItemModel = mongoose.model<ProcessItem & mongoose.Document>('ProcessItem', processItemSchema);

export default processItemModel;

