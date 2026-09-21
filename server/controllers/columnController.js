import Column from '../models/Column.js';
import Task from '../models/Task.js';

// @GET /api/columns?project=id
export const getColumns = async (req, res) => {
  try {
    const columns = await Column.find({ project: req.query.project }).sort({ order: 1 });
    res.json(columns);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @POST /api/columns
export const createColumn = async (req, res) => {
  try {
    const { name, project, color } = req.body;
    const count = await Column.countDocuments({ project });
    const column = await Column.create({ name, project, color, order: count });
    const io = req.app.get('io');
    io.to(project).emit('column:created', column);
    res.status(201).json(column);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @PUT /api/columns/:id
export const updateColumn = async (req, res) => {
  try {
    const column = await Column.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!column) return res.status(404).json({ message: 'Column not found' });
    const io = req.app.get('io');
    io.to(column.project.toString()).emit('column:updated', column);
    res.json(column);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @DELETE /api/columns/:id
export const deleteColumn = async (req, res) => {
  try {
    const column = await Column.findById(req.params.id);
    if (!column) return res.status(404).json({ message: 'Column not found' });
    await Task.deleteMany({ column: column._id });
    const projectId = column.project.toString();
    await column.deleteOne();
    const io = req.app.get('io');
    io.to(projectId).emit('column:deleted', { _id: req.params.id });
    res.json({ message: 'Column deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @PUT /api/columns/reorder
export const reorderColumns = async (req, res) => {
  try {
    const { columns } = req.body; // [{ _id, order }]
    await Promise.all(columns.map(c => Column.findByIdAndUpdate(c._id, { order: c.order })));
    res.json({ message: 'Reordered' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
