import mongoose from 'mongoose';

const columnSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  order: { type: Number, default: 0 },
  color: { type: String, default: '#6366f1' },
}, { timestamps: true });

export default mongoose.model('Column', columnSchema);
