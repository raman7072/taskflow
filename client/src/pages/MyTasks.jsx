import { useEffect, useState, useMemo } from 'react';
import { taskAPI } from '../api/services.js';
import { isPast, isWithinInterval, addDays } from 'date-fns';
import { format } from 'date-fns';
import PriorityBadge from '../components/UI/PriorityBadge.jsx';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const PRIORITY_ORDER = { urgent: 0, high: 1, medium: 2, low: 3, none: 4 };

export default function MyTasksPage() {
  const [tasks, setTasks]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [sortBy, setSortBy]       = useState('priority');
  const [deletingTaskId, setDeletingTaskId] = useState(null);
  const [hoveredTaskId, setHoveredTaskId]   = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    taskAPI.getMy()
      .then(({ data }) => setTasks(data))
      .finally(() => setLoading(false));
  }, []);

  const handleDeleteTask = async (e, task) => {
    e.stopPropagation();
    if (!window.confirm(`Delete "${task.title}"? This cannot be undone.`)) return;
    setDeletingTaskId(task._id);
    try {
      await taskAPI.delete(task._id);
      setTasks((prev) => prev.filter((t) => t._id !== task._id));
      toast.success('Task deleted');
    } catch {
      toast.error('Failed to delete task');
    } finally {
      setDeletingTaskId(null);
    }
  };

  const now = new Date();

  const classify = (task) => {
    const due = task.dueDate ? new Date(task.dueDate) : null;
    if (!due) return 'noduedate';
    if (isPast(due)) return 'overdue';
    if (isWithinInterval(due, { start: now, end: addDays(now, 3) })) return 'soon';
    return 'upcoming';
  };

  const counts = useMemo(() => ({
    all:       tasks.length,
    overdue:   tasks.filter(t => classify(t) === 'overdue').length,
    soon:      tasks.filter(t => classify(t) === 'soon').length,
    noduedate: tasks.filter(t => classify(t) === 'noduedate').length,
  }), [tasks]);

  const filtered = useMemo(() => {
    let list = tasks;
    if (activeFilter === 'overdue')   list = tasks.filter(t => classify(t) === 'overdue');
    if (activeFilter === 'soon')      list = tasks.filter(t => classify(t) === 'soon');
    if (activeFilter === 'noduedate') list = tasks.filter(t => classify(t) === 'noduedate');

    return [...list].sort((a, b) => {
      if (sortBy === 'priority') {
        return (PRIORITY_ORDER[a.priority] ?? 4) - (PRIORITY_ORDER[b.priority] ?? 4);
      }
      if (sortBy === 'due') {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate) - new Date(b.dueDate);
      }
      if (sortBy === 'project') {
        return (a.project?.name || '').localeCompare(b.project?.name || '');
      }
      return 0;
    });
  }, [tasks, activeFilter, sortBy]);

  if (loading) {
    return <div className="loading-screen"><div className="spinner spinner-lg" /></div>;
  }

  const tabs = [
    { key: 'all',       label: 'All' },
    { key: 'overdue',   label: 'Overdue' },
    { key: 'soon',      label: 'Due Soon' },
    { key: 'noduedate', label: 'No Date' },
  ];

  return (
    <div className="dashboard-page">
      {/* Header */}
      <div className="my-tasks-header">
        <div className="dashboard-greeting" style={{ marginBottom: 0 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: 400 }}>My Tasks</h1>
          <p>All tasks assigned to you across projects</p>
        </div>
        <span style={{
          fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)',
          background: 'var(--bg-elevated)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-full)', padding: '4px 12px',
          letterSpacing: '0.06em', textTransform: 'uppercase',
        }}>
          {tasks.length} total
        </span>
      </div>

      {/* Toolbar: Filter tabs + Sort */}
      <div className="my-tasks-toolbar">
        <div className="filter-tabs">
          {tabs.map(({ key, label }) => (
            <button
              key={key}
              className={`filter-tab ${activeFilter === key ? 'active' : ''}`}
              onClick={() => setActiveFilter(key)}
              id={`filter-tab-${key}`}
            >
              {label}
              <span className="filter-tab-badge">{counts[key]}</span>
            </button>
          ))}
        </div>

        <div className="sort-controls" style={{ marginLeft: 'auto', marginBottom: 0 }}>
          <span className="sort-label">Sort by</span>
          <select
            className="sort-select"
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            id="sort-select"
          >
            <option value="priority">Priority</option>
            <option value="due">Due Date</option>
            <option value="project">Project</option>
          </select>
        </div>
      </div>

      {/* Task List */}
      {filtered.length === 0 ? (
        <div className="empty-state" style={{ marginTop: '60px' }}>
          <span className="empty-state-icon">🎉</span>
          <span className="empty-state-title">
            {activeFilter === 'all' ? "You're all caught up!" : `No tasks in this filter`}
          </span>
          <span className="empty-state-desc">
            {activeFilter === 'all'
              ? 'No tasks are currently assigned to you.'
              : 'Try switching to a different filter.'}
          </span>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '760px' }}>
          {filtered.map((task) => {
            const cat = classify(task);
            const isOverdue = cat === 'overdue';
            const isSoon = cat === 'soon';
            return (
              <div
                key={task._id}
                className={`task-row priority-${task.priority || 'none'}`}
                onClick={() => navigate(`/board/${task.project?._id}`)}
                id={`task-row-${task._id}`}
                role="button"
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && navigate(`/board/${task.project?._id}`)}
                onMouseEnter={() => setHoveredTaskId(task._id)}
                onMouseLeave={() => setHoveredTaskId(null)}
              >
                {/* Project icon */}
                <span style={{
                  width: 34, height: 34, borderRadius: 'var(--radius)',
                  background: task.project?.color ? `${task.project.color}28` : 'rgba(20,16,8,0.08)',
                  border: '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '16px', flexShrink: 0,
                  filter: 'saturate(0.45) brightness(0.82)',
                }}>
                  {task.project?.icon || '📋'}
                </span>

                {/* Title & project */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '13.5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {task.title}
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {task.project?.name}
                    {task.dueDate && (
                      <span style={{
                        marginLeft: '8px',
                        color: isOverdue ? 'var(--danger)' : isSoon ? 'var(--warning)' : 'inherit',
                        fontWeight: isOverdue || isSoon ? 600 : 400,
                      }}>
                        · Due {format(new Date(task.dueDate), 'MMM d, yyyy')}
                        {isOverdue && ' ⚠'}
                        {isSoon && ' ◷'}
                      </span>
                    )}
                  </div>
                </div>

                <PriorityBadge priority={task.priority} />

                {/* Delete task button — visible on hover */}
                {(hoveredTaskId === task._id || deletingTaskId === task._id) && (
                  <button
                    onClick={(e) => handleDeleteTask(e, task)}
                    disabled={deletingTaskId === task._id}
                    title="Delete task"
                    id={`delete-mytask-${task._id}`}
                    style={{
                      flexShrink: 0, width: 28, height: 28, borderRadius: 'var(--radius-sm)',
                      border: '1px solid rgba(122,44,38,0.22)', background: 'var(--danger-soft)',
                      color: 'var(--danger)', cursor: 'pointer', fontSize: '13px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all var(--transition)', padding: 0, marginLeft: '4px',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--danger)'; e.currentTarget.style.color = 'var(--text-inverse)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'var(--danger-soft)'; e.currentTarget.style.color = 'var(--danger)'; }}
                  >
                    {deletingTaskId === task._id ? '…' : '🗑'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
