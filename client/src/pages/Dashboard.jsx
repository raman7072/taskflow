import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useWorkspaceStore } from '../store/workspaceStore.js';
import { taskAPI, projectAPI } from '../api/services.js';
import { format, isPast } from 'date-fns';
import PriorityBadge from '../components/UI/PriorityBadge.jsx';
import toast from 'react-hot-toast';

/* ─── SVG Progress Ring ─── */
function ProgressRing({ percent = 0, size = 44, stroke = 3, className = '' }) {
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(percent, 100) / 100) * circ;
  return (
    <svg width={size} height={size} className={`stat-ring ${className}`}>
      <circle className="stat-ring-bg" cx={size / 2} cy={size / 2} r={r} />
      <circle
        className="stat-ring-fill"
        cx={size / 2} cy={size / 2} r={r}
        strokeDasharray={`${circ} ${circ}`}
        strokeDashoffset={offset}
      />
    </svg>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { workspaces, projects, fetchWorkspaces, removeProject } = useWorkspaceStore();
  const navigate = useNavigate();
  const [myTasks, setMyTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [deletingProjectId, setDeletingProjectId] = useState(null);
  const [hoveredProjectId, setHoveredProjectId] = useState(null);

  useEffect(() => {
    fetchWorkspaces();
    setLoadingTasks(true);
    taskAPI.getMy()
      .then(({ data }) => setMyTasks(data))
      .finally(() => setLoadingTasks(false));
  }, []);

  const handleDeleteProject = async (e, proj) => {
    e.stopPropagation();
    if (!window.confirm(`Delete "${proj.name}" and all its tasks? This cannot be undone.`)) return;
    setDeletingProjectId(proj._id);
    try {
      await projectAPI.delete(proj._id);
      removeProject(proj._id);
      toast.success('Project deleted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete project');
    } finally {
      setDeletingProjectId(null);
    }
  };

  const overdueTasks = myTasks.filter((t) => t.dueDate && isPast(new Date(t.dueDate)));
  const completedCount = myTasks.filter((t) => t.completed).length;
  const completionPct = myTasks.length > 0 ? Math.round((completedCount / myTasks.length) * 100) : 0;
  const projectUsagePct = projects.length > 0 ? Math.min(Math.round((projects.length / 10) * 100), 100) : 0;
  const overduePct = myTasks.length > 0 ? Math.round((overdueTasks.length / myTasks.length) * 100) : 0;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const stats = [
    { label: 'Total Projects', value: projects.length, icon: '📁', type: 'accent', pct: projectUsagePct },
    { label: 'My Open Tasks',  value: myTasks.length,   icon: '✅', type: 'success', pct: completionPct },
    { label: 'Overdue',        value: overdueTasks.length, icon: '⚠️', type: 'danger', pct: overduePct },
    { label: 'Workspaces',     value: workspaces.length, icon: '🏢', type: 'warning', pct: Math.min(workspaces.length * 20, 100) },
  ];

  return (
    <div className="dashboard-page">
      {/* Greeting + Quick Add */}
      <div className="dashboard-greeting-row">
        <div className="dashboard-greeting">
          <h1>{greeting}, {user?.name?.split(' ')[0]} ✦</h1>
          <p>Here's what's on your desk today</p>
        </div>
        {projects.length > 0 && (
          <button
            className="quick-add-btn"
            onClick={() => navigate(`/board/${projects[0]._id}`)}
            id="quick-board-btn"
          >
            ＋ Open Board
          </button>
        )}
      </div>

      {/* Stats with progress rings */}
      <div className="stats-grid">
        {stats.map((s) => (
          <div key={s.label} className={`stat-card ${s.type}`}>
            <div className="stat-card-content">
              <span className="stat-icon">{s.icon}</span>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
            <ProgressRing percent={s.pct} size={46} stroke={3} />
          </div>
        ))}
      </div>

      <div className="dashboard-sections">
        {/* My Tasks */}
        <div className="section-card">
          <div className="section-title">
            <span>✅</span> My Tasks
            {loadingTasks && <span className="spinner" style={{ marginLeft: 'auto' }} />}
          </div>
          {myTasks.length === 0 && !loadingTasks ? (
            <div className="empty-state">
              <span className="empty-state-icon">🎉</span>
              <span className="empty-state-title">All caught up!</span>
              <span className="empty-state-desc">No tasks assigned to you</span>
            </div>
          ) : (
            myTasks.slice(0, 8).map((task) => (
              <div key={task._id} className="my-task-item">
                <span style={{ marginTop: '2px', flexShrink: 0 }}>
                  <PriorityBadge priority={task.priority} showIcon />
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="my-task-title" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {task.title}
                  </div>
                  <div className="my-task-project">
                    {task.project?.icon} {task.project?.name}
                    {task.dueDate && (
                      <span style={{ marginLeft: '8px', color: isPast(new Date(task.dueDate)) ? 'var(--danger)' : 'var(--text-muted)' }}>
                        · Due {format(new Date(task.dueDate), 'MMM d')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Recent Projects */}
        <div className="section-card">
          <div className="section-title"><span>🚀</span> Recent Projects</div>
          {projects.length === 0 ? (
            <div className="empty-state">
              <span className="empty-state-icon">📋</span>
              <span className="empty-state-title">No projects yet</span>
              <span className="empty-state-desc">Create a project in the sidebar</span>
            </div>
          ) : (
            projects.slice(0, 8).map((proj) => (
              <div
                key={proj._id}
                className="my-task-item"
                style={{ cursor: 'pointer', position: 'relative' }}
                onClick={() => navigate(`/board/${proj._id}`)}
                onMouseEnter={() => setHoveredProjectId(proj._id)}
                onMouseLeave={() => setHoveredProjectId(null)}
              >
                <span style={{
                  width: 34, height: 34, borderRadius: 'var(--radius)',
                  background: proj.color ? `${proj.color}30` : 'rgba(20,16,8,0.09)',
                  border: '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '16px', flexShrink: 0,
                  filter: 'saturate(0.5) brightness(0.85)',
                }}>
                  {proj.icon || '📋'}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="my-task-title">{proj.name}</div>
                  <div className="my-task-project">{proj.description || 'No description'}</div>
                </div>
                {/* Delete project button */}
                {(hoveredProjectId === proj._id || deletingProjectId === proj._id) && (
                  <button
                    onClick={(e) => handleDeleteProject(e, proj)}
                    disabled={deletingProjectId === proj._id}
                    title={`Delete "${proj.name}"`}
                    id={`dashboard-delete-proj-${proj._id}`}
                    style={{
                      flexShrink: 0, width: 26, height: 26, borderRadius: 'var(--radius-sm)',
                      border: '1px solid rgba(122,44,38,0.22)', background: 'var(--danger-soft)',
                      color: 'var(--danger)', cursor: 'pointer', fontSize: '12px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all var(--transition)', padding: 0,
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--danger)'; e.currentTarget.style.color = 'var(--text-inverse)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'var(--danger-soft)'; e.currentTarget.style.color = 'var(--danger)'; }}
                  >
                    {deletingProjectId === proj._id ? '…' : '🗑'}
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
