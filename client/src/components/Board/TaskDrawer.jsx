import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { taskAPI } from '../../api/services.js';
import { useBoardStore } from '../../store/boardStore.js';
import { useAuth } from '../../context/AuthContext.jsx';
import PriorityBadge, { PRIORITY_META } from '../UI/PriorityBadge.jsx';
import MemberAvatar from '../UI/MemberAvatar.jsx';
import toast from 'react-hot-toast';

export default function TaskDrawer({ task, onClose, members = [] }) {
  const { user } = useAuth();
  const { updateTask, removeTask } = useBoardStore();
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDesc, setEditDesc] = useState(task.description || '');
  const [editPriority, setEditPriority] = useState(task.priority || 'none');
  const [editAssignee, setEditAssignee] = useState(task.assignee?._id || '');
  const [editDue, setEditDue] = useState(task.dueDate ? task.dueDate.slice(0, 10) : '');
  const [commentText, setCommentText] = useState('');
  const [saving, setSaving] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [localTask, setLocalTask] = useState(task);

  useEffect(() => {
    setLocalTask(task);
    setEditTitle(task.title);
    setEditDesc(task.description || '');
    setEditPriority(task.priority || 'none');
    setEditAssignee(task.assignee?._id || '');
    setEditDue(task.dueDate ? task.dueDate.slice(0, 10) : '');
  }, [task]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await taskAPI.update(localTask._id, {
        title: editTitle,
        description: editDesc,
        priority: editPriority,
        assignee: editAssignee || null,
        dueDate: editDue || null,
      });
      updateTask(data);
      setLocalTask(data);
      toast.success('Task updated');
    } catch {
      toast.error('Failed to update task');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await taskAPI.delete(localTask._id);
      removeTask(localTask._id);
      onClose();
      toast.success('Task deleted');
    } catch {
      toast.error('Failed to delete task');
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setSubmittingComment(true);
    try {
      const { data } = await taskAPI.addComment(localTask._id, commentText.trim());
      updateTask(data);
      setLocalTask(data);
      setCommentText('');
    } catch {
      toast.error('Failed to add comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <div className="drawer" role="dialog" aria-label="Task details">
        {/* Header */}
        <div className="drawer-header">
          <div style={{ flex: 1 }}>
            <input
              className="form-input"
              style={{ fontSize: '17px', fontWeight: 700, background: 'transparent', border: '1px solid transparent', padding: '4px 0' }}
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onFocus={(e) => e.target.style.borderColor = 'var(--border-focus)'}
              onBlur={(e) => e.target.style.borderColor = 'transparent'}
              id="task-drawer-title"
            />
          </div>
          <div style={{ display: 'flex', gap: '6px', flexShrink: 0, marginLeft: '12px' }}>
            <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving} id="task-save-btn">
              {saving ? <span className="spinner" /> : 'Save'}
            </button>
            <button className="btn btn-danger btn-sm" onClick={handleDelete} id="task-delete-btn">🗑</button>
            <button className="btn btn-ghost btn-sm btn-icon" onClick={onClose}>✕</button>
          </div>
        </div>

        <div className="drawer-body">
          {/* Meta grid */}
          <div className="drawer-meta">
            <div className="drawer-meta-item">
              <span className="drawer-meta-label">Priority</span>
              <select className="form-select" value={editPriority} onChange={(e) => setEditPriority(e.target.value)} id="task-priority-select">
                {Object.entries(PRIORITY_META).map(([k, v]) => (
                  <option key={k} value={k}>{v.icon} {v.label}</option>
                ))}
              </select>
            </div>

            <div className="drawer-meta-item">
              <span className="drawer-meta-label">Due Date</span>
              <input
                className="form-input"
                type="date"
                value={editDue}
                onChange={(e) => setEditDue(e.target.value)}
                id="task-due-input"
              />
            </div>

            <div className="drawer-meta-item" style={{ gridColumn: '1 / -1' }}>
              <span className="drawer-meta-label">Assignee</span>
              <select className="form-select" value={editAssignee} onChange={(e) => setEditAssignee(e.target.value)} id="task-assignee-select">
                <option value="">Unassigned</option>
                {members.map((m) => (
                  <option key={m.user._id} value={m.user._id}>{m.user.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Labels */}
          {localTask.labels?.length > 0 && (
            <div>
              <span className="drawer-meta-label">Labels</span>
              <div className="task-labels" style={{ marginTop: '8px' }}>
                {localTask.labels.map((l) => <span key={l} className="task-label">{l}</span>)}
              </div>
            </div>
          )}

          {/* Description */}
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-textarea"
              placeholder="Add a description..."
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              style={{ minHeight: '120px' }}
              id="task-desc-textarea"
            />
          </div>

          {/* Comments */}
          <div>
            <span className="drawer-meta-label" style={{ display: 'block', marginBottom: '12px' }}>
              Activity ({localTask.comments?.length || 0})
            </span>

            {localTask.comments?.map((c, i) => (
              <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
                <MemberAvatar user={c.user} size="sm" />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '12.5px', fontWeight: 600 }}>{c.user?.name}</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {format(new Date(c.createdAt), 'MMM d, h:mm a')}
                    </span>
                  </div>
                  <div style={{
                    background: 'var(--bg-elevated)', borderRadius: 'var(--radius)',
                    padding: '8px 12px', fontSize: '13px', color: 'var(--text-primary)'
                  }}>
                    {c.text}
                  </div>
                </div>
              </div>
            ))}

            <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <MemberAvatar user={user} size="sm" />
              <div style={{ flex: 1, display: 'flex', gap: '8px' }}>
                <input
                  className="form-input"
                  placeholder="Add a comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  style={{ flex: 1 }}
                  id="comment-input"
                />
                <button type="submit" className="btn btn-primary btn-sm" disabled={submittingComment || !commentText.trim()}>
                  {submittingComment ? <span className="spinner" /> : '→'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
