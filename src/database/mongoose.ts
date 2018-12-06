import * as mongoose from 'mongoose';

mongoose.connect('mongodb://localhost:27017/werr', { useNewUrlParser: true });

export default mongoose;