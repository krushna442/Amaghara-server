import mongoose from 'mongoose';
const messageSchema = new mongoose.Schema({
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    propertyId: { type:String },
    name : { type: String, required: true },
    email : { type: String,  },
    phone : { type: Number, required: true },
    subject: { type: String},
    message: { type: String },
    timestamp: { type: Date, default: Date.now }
});
const Message = mongoose.model('Message', messageSchema);
export default Message;