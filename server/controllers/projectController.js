import Project from '../models/Project.js';
import Column from '../models/Column.js';
import Task from '../models/Task.js';

// @POST /api/projects
export const createProject = async (req, res) => {
  try {
    const { name, description, workspace, color, icon } = req.body;
    const project = await Project.create({ name, description, workspace, color, icon, owner: req.user._id });

    // Create default columns
    const defaultColumns = ['To Do', 'In Progress', 'In Review', 'Done'];
    const columnColors = ['#6366f1', '#f59e0b', '#3b82f6', '#10b981'];
    for (let i = 0; i < defaultColumns.length; i++) {
      await Column.create({ name: defaultColumns[i], project: project._id, order: i, color: columnColors[i] });
    }

    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @GET /api/projects?workspace=id
export const getProjects = async (req, res) => {
  try {
    const projects = await Project.find({ workspace: req.query.workspace })
      .populate('owner', 'name email avatarColor')
      .sort({ createdAt: -1 });
    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @GET /api/projects/:id
export const getProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).populate('owner', 'name email avatarColor');
    if (!project) return res.status(404).json({ message: 'Project not found' });
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @PUT /api/projects/:id
export const updateProject = async (req, res) => {
  try {
    const project = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!project) return res.status(404).json({ message: 'Project not found' });
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @DELETE /api/projects/:id
export const deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    await Column.deleteMany({ project: project._id });
    await Task.deleteMany({ project: project._id });
    await project.deleteOne();
    res.json({ message: 'Project deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
