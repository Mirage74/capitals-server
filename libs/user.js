const mongoose = require('mongoose');

const beautifyUnique = require('mongoose-beautiful-unique-validation');
const crypto = require('crypto'); // crypto module for node.js for e.g. creating hashes

mongoose.plugin(beautifyUnique);



const userSchema = new mongoose.Schema({
  displayName: String,
  passwordHash: String,
  bestScore: Array,
  lastRes: Array,
  debuginfo: Array
  salt: String,
}, {
  timestamps: true
});

userSchema.virtual('password')
.set(function (password) {
  this._plainPassword = password;
  if (password) {
    this.salt = crypto.randomBytes(128).toString('base64');
    this.passwordHash = crypto.pbkdf2Sync(password, this.salt, 1, 128, 'sha1').toString('base64');
  } else {
    this.salt = undefined;
    this.passwordHash = undefined;
  }
})

.get(function () {
  return this._plainPassword;
});

userSchema.methods.checkPassword = function (password) {
  if (!password) return false;
  if (!this.passwordHash) return false;

  return crypto.pbkdf2Sync(password, this.salt, 1, 128, 'sha1').toString('base64') == this.passwordHash;
};


userSchema.statics.publicFields = ['id', 'displayName', 'bestScore', 'lastRes', 'debuginfo'];

module.exports = mongoose.model('cptUser', userSchema);
