import Workspace from '../models/Workspace.js';
import Project from '../models/Project.js';
import Column from '../models/Column.js';
import Task from '../models/Task.js';


// @POST /api/workspaces
export const createWorkspace = async (req, res) => {
  try {
    const { name, description, color } = req.body;
    const workspace = await Workspace.create({
      name,
      description,
      color,
      owner: req.user._id,
      members: [{ user: req.user._id, role: 'admin' }],
    });
    await workspace.populate('members.user', 'name email avatarColor');
    res.status(201).json(workspace);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @GET /api/workspaces
export const getWorkspaces = async (req, res) => {
  try {
    const workspaces = await Workspace.find({ 'members.user': req.user._id })
      .populate('owner', 'name email avatarColor')
      .populate('members.user', 'name email avatarColor')
      .sort({ createdAt: -1 });
    res.json(workspaces);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @GET /api/workspaces/:id
export const getWorkspace = async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id)
      .populate('owner', 'name email avatarColor')
      .populate('members.user', 'name email avatarColor');
    if (!workspace) return res.status(404).json({ message: 'Workspace not found' });
    res.json(workspace);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @PUT /api/workspaces/:id
export const updateWorkspace = async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id);
    if (!workspace) return res.status(404).json({ message: 'Workspace not found' });
    if (workspace.owner.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Not authorized' });

    const updated = await Workspace.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('members.user', 'name email avatarColor');
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @DELETE /api/workspaces/:id
export const deleteWorkspace = async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id);
    if (!workspace) return res.status(404).json({ message: 'Workspace not found' });
    if (workspace.owner.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Not authorized' });

    // Cascade: find all projects in this workspace
    const projects = await Project.find({ workspace: workspace._id });
    const projectIds = projects.map((p) => p._id);

    // Delete all tasks and columns belonging to these projects
    if (projectIds.length > 0) {
      await Task.deleteMany({ project: { $in: projectIds } });
      await Column.deleteMany({ project: { $in: projectIds } });
      await Project.deleteMany({ _id: { $in: projectIds } });
    }

    await workspace.deleteOne();
    res.json({ message: 'Workspace deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

