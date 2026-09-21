import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useWorkspaceStore } from '../../store/workspaceStore.js';
import MemberAvatar from '../UI/MemberAvatar.jsx';
import Modal from '../UI/Modal.jsx';
import { workspaceAPI, projectAPI } from '../../api/services.js';
import { useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';

const PROJECT_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#14b8a6'];
const PROJECT_ICONS = ['📋', '🚀', '💡', '🎯', '🔥', '⚡', '🌟', '📊', '🛠️', '🎨'];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { workspaces, activeWorkspace, projects, fetchWorkspaces, setActiveWorkspace, addWorkspace, addProject, removeProject, removeWorkspace } = useWorkspaceStore();

  const [showNewWorkspace, setShowNewWorkspace] = useState(false);
  const [showNewProject, setShowNewProject] = useState(false);
  const [wsName, setWsName] = useState('');
  const [wsColor, setWsColor] = useState('#6366f1');
  const [projName, setProjName] = useState('');
  const [projColor, setProjColor] = useState('#6366f1');
  const [projIcon, setProjIcon] = useState('📋');
  const [saving, setSaving] = useState(false);
  const [deletingProjectId, setDeletingProjectId] = useState(null);
  const [hoveredProjectId, setHoveredProjectId] = useState(null);
  const [deletingWsId, setDeletingWsId] = useState(null);
  const [hoveredWsId, setHoveredWsId] = useState(null);

  const handleCreateWorkspace = async (e) => {
    e.preventDefault();
    if (!wsName.trim()) return;
    setSaving(true);
    try {
      const { data } = await workspaceAPI.create({ name: wsName, color: wsColor });
      addWorkspace(data);
      setActiveWorkspace(data);
      setShowNewWorkspace(false);
      setWsName('');
      toast.success('Workspace created!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create workspace');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProject = async (e, proj) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm(`Delete "${proj.name}" and all its tasks? This cannot be undone.`)) return;
    setDeletingProjectId(proj._id);
    try {
      await projectAPI.delete(proj._id);
      removeProject(proj._id);
      toast.success('Project deleted');
      if (location.pathname === `/board/${proj._id}`) navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete project');
    } finally {
      setDeletingProjectId(null);
    }
  };

  const handleDeleteWorkspace = async (e, ws) => {
    e.stopPropagation();
    if (!window.confirm(`Delete workspace "${ws.name}" and ALL its projects & tasks? This cannot be undone.`)) return;
    setDeletingWsId(ws._id);
    try {
      await workspaceAPI.delete(ws._id);
      removeWorkspace(ws._id);
      toast.success('Workspace deleted');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete workspace');
    } finally {
      setDeletingWsId(null);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!projName.trim() || !activeWorkspace) return;
    setSaving(true);
    try {
      const { data } = await projectAPI.create({
        name: projName, workspace: activeWorkspace._id,
        color: projColor, icon: projIcon
      });
      addProject(data);
      setShowNewProject(false);
      setProjName('');
      toast.success('Project created!');
      navigate(`/board/${data._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create project');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <aside className="sidebar">
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">⚡</div>
          <span className="sidebar-logo-text">TaskFlow</span>
        </div>

        {/* Main Nav */}
        <div className="sidebar-section">
          <NavLink to="/dashboard" className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}>
            <span className="nav-icon">📊</span> Dashboard
          </NavLink>
          <NavLink to="/my-tasks" className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}>
            <span className="nav-icon">✅</span> My Tasks
          </NavLink>
        </div>

        <div className="divider" style={{ margin: '0 12px' }} />

        {/* Workspace Selector */}
        <div className="sidebar-section">
          <div className="sidebar-workspace-header">
            <span className="sidebar-section-label">Workspace</span>
          </div>

          {workspaces.length === 0 ? (
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', padding: '0 12px 8px' }}>No workspaces yet</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginBottom: '6px' }}>
              {workspaces.map((ws) => (
                <div
                  key={ws._id}
                  className="sidebar-project-row"
                  onMouseEnter={() => setHoveredWsId(ws._id)}
                  onMouseLeave={() => setHoveredWsId(null)}
                >
                  <button
                    className={`sidebar-nav-item ${activeWorkspace?._id === ws._id ? 'active' : ''}`}
                    onClick={() => setActiveWorkspace(ws)}
                    style={{ paddingRight: '30px' }}
                  >
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: ws.color, flexShrink: 0, display: 'inline-block', filter: 'saturate(0.5) brightness(0.8)' }} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ws.name}</span>
                  </button>
                  {/* Delete workspace button — visible on hover */}
                  {(hoveredWsId === ws._id || deletingWsId === ws._id) && (
                    <button
                      className="sidebar-project-delete"
                      onClick={(e) => handleDeleteWorkspace(e, ws)}
                      title={`Delete workspace "${ws.name}"`}
                      disabled={deletingWsId === ws._id}
                      id={`delete-ws-${ws._id}`}
                    >
                      {deletingWsId === ws._id ? '…' : '🗑'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
          <button className="sidebar-nav-item" style={{ color: 'var(--accent-hover)' }} onClick={() => setShowNewWorkspace(true)}>
            <span className="nav-icon">＋</span> New Workspace
          </button>
        </div>

        <div className="divider" style={{ margin: '0 12px' }} />

        {/* Projects */}
        {activeWorkspace && (
          <div className="sidebar-section" style={{ flex: 1, overflowY: 'auto' }}>
            <div className="sidebar-workspace-header">
              <span className="sidebar-section-label">Projects</span>
            </div>
            {projects.map((proj) => (
              <div
                key={proj._id}
                className="sidebar-project-row"
                style={{ position: 'relative' }}
                onMouseEnter={() => setHoveredProjectId(proj._id)}
                onMouseLeave={() => setHoveredProjectId(null)}
              >
                <NavLink
                  to={`/board/${proj._id}`}
                  className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
                  style={{ paddingRight: '30px' }}
                >
                  <span>{proj.icon || '📋'}</span>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{proj.name}</span>
                </NavLink>
                {/* Delete project button — visible on hover */}
                {(hoveredProjectId === proj._id || deletingProjectId === proj._id) && (
                  <button
                    className="sidebar-project-delete"
                    onClick={(e) => handleDeleteProject(e, proj)}
                    title={`Delete "${proj.name}"`}
                    disabled={deletingProjectId === proj._id}
                    id={`delete-project-${proj._id}`}
                  >
                    {deletingProjectId === proj._id ? '…' : '🗑'}
                  </button>
                )}
              </div>
            ))}
            <button className="sidebar-nav-item" style={{ color: 'var(--accent-hover)' }} onClick={() => setShowNewProject(true)}>
              <span className="nav-icon">＋</span> New Project
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="sidebar-footer">
          <div className="user-pill" onClick={logout} title="Click to logout">
            <MemberAvatar user={user} size="sm" />
            <div className="user-pill-info">
              <div className="user-pill-name">{user?.name}</div>
              <div className="user-pill-email">{user?.email}</div>
            </div>
            <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>↩</span>
          </div>
        </div>
      </aside>

      {/* New Workspace Modal */}
      <Modal isOpen={showNewWorkspace} onClose={() => setShowNewWorkspace(false)} title="New Workspace">
        <form onSubmit={handleCreateWorkspace} className="modal-body">
          <div className="form-group">
            <label className="form-label">Workspace Name</label>
            <input
              className="form-input"
              placeholder="e.g. Acme Corp"
              value={wsName}
              onChange={(e) => setWsName(e.target.value)}
              autoFocus
              id="ws-name-input"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Color</label>
            <div className="color-swatch-grid">
              {PROJECT_COLORS.map((c) => (
                <div
                  key={c}
                  className={`color-swatch ${wsColor === c ? 'selected' : ''}`}
                  style={{ background: c }}
                  onClick={() => setWsColor(c)}
                />
              ))}
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setShowNewWorkspace(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <span className="spinner" /> : 'Create Workspace'}
            </button>
          </div>
        </form>
      </Modal>

      {/* New Project Modal */}
      <Modal isOpen={showNewProject} onClose={() => setShowNewProject(false)} title="New Project">
        <form onSubmit={handleCreateProject} className="modal-body">
          <div className="form-group">
            <label className="form-label">Project Name</label>
            <input
              className="form-input"
              placeholder="e.g. Website Redesign"
              value={projName}
              onChange={(e) => setProjName(e.target.value)}
              autoFocus
              id="proj-name-input"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Icon</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {PROJECT_ICONS.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  style={{
                    fontSize: '20px', padding: '6px 10px', borderRadius: 'var(--radius)',
                    background: projIcon === icon ? 'var(--accent-soft)' : 'var(--bg-elevated)',
                    border: `1px solid ${projIcon === icon ? 'var(--accent)' : 'var(--border)'}`,
                    cursor: 'pointer'
                  }}
                  onClick={() => setProjIcon(icon)}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Color</label>
            <div className="color-swatch-grid">
              {PROJECT_COLORS.map((c) => (
                <div
                  key={c}
                  className={`color-swatch ${projColor === c ? 'selected' : ''}`}
                  style={{ background: c }}
                  onClick={() => setProjColor(c)}
                />
              ))}
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setShowNewProject(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <span className="spinner" /> : 'Create Project'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
