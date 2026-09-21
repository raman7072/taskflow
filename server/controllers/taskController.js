import Task from '../models/Task.js';

// @GET /api/tasks?project=id
export const getTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ project: req.query.project })
      .populate('assignee', 'name email avatarColor')
      .populate('comments.user', 'name avatarColor')
      .sort({ order: 1 });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @GET /api/tasks/my — tasks assigned to me
export const getMyTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ assignee: req.user._id, completed: false })
      .populate('project', 'name color icon')
      .sort({ dueDate: 1, createdAt: -1 });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @POST /api/tasks
export const createTask = async (req, res) => {
  try {
    const { title, column, project, priority, assignee, dueDate, labels } = req.body;
    const count = await Task.countDocuments({ column });
    const task = await Task.create({ title, column, project, priority, assignee, dueDate, labels, order: count });
    await task.populate('assignee', 'name email avatarColor');
    const io = req.app.get('io');
    io.to(project).emit('task:created', task);
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @PUT /api/tasks/:id
export const updateTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('assignee', 'name email avatarColor')
      .populate('comments.user', 'name avatarColor');
    if (!task) return res.status(404).json({ message: 'Task not found' });
    const io = req.app.get('io');
    io.to(task.project.toString()).emit('task:updated', task);
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @PATCH /api/tasks/:id/move — move to another column
export const moveTask = async (req, res) => {
  try {
    const { column, order } = req.body;
    const task = await Task.findByIdAndUpdate(req.params.id, { column, order }, { new: true })
      .populate('assignee', 'name email avatarColor');
    if (!task) return res.status(404).json({ message: 'Task not found' });
    const io = req.app.get('io');
    io.to(task.project.toString()).emit('task:moved', task);
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @DELETE /api/tasks/:id
export const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    const projectId = task.project.toString();
    await task.deleteOne();
    const io = req.app.get('io');
    io.to(projectId).emit('task:deleted', { _id: req.params.id });
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @POST /api/tasks/:id/comments
export const addComment = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    task.comments.push({ user: req.user._id, text: req.body.text });
    await task.save();
    await task.populate('comments.user', 'name avatarColor');
    await task.populate('assignee', 'name email avatarColor');
    const io = req.app.get('io');
    io.to(task.project.toString()).emit('task:updated', task);
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
