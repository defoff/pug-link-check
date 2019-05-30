import * as mongoose from 'mongoose';
import User from '../interfaces/user.interface';
import * as bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema({
    _id               : { type: String, default: new mongoose.Types.ObjectId().toHexString() },
    email             : String,
    password          : String,
    role              : { type: String, default: 'user' },
    verified          : { type: Boolean, default: false }
});

userSchema.methods.generateHash = function(password) {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(8));
};

// checking if password is valid
userSchema.methods.validPassword = function(password) {
  return bcrypt.compareSync(password, this.password);
};

userSchema.methods.isAdmin = function() {
  console.log('checked if current User is Admin');
}

const userModel = mongoose.model<User & mongoose.Document>('User', userSchema);

export default userModel;

