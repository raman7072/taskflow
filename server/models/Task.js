import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  column: { type: mongoose.Schema.Types.ObjectId, ref: 'Column', required: true },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  assignee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  priority: {
    type: String,
    enum: ['urgent', 'high', 'medium', 'low', 'none'],
    default: 'none',
  },
  dueDate: { type: Date, default: null },
  labels: [{ type: String }],
  order: { type: Number, default: 0 },
  completed: { type: Boolean, default: false },
  comments: [commentSchema],
}, { timestamps: true });

export default mongoose.model('Task', taskSchema);
