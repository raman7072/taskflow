import { useState } from 'react';
import { taskAPI } from '../../api/services.js';
import { useBoardStore } from '../../store/boardStore.js';
import Modal from '../UI/Modal.jsx';
import { PRIORITY_META } from '../UI/PriorityBadge.jsx';
import toast from 'react-hot-toast';

export default function AddTaskModal({ isOpen, onClose, columnId, projectId, members = [] }) {
  const { addTask } = useBoardStore();
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('none');
  const [assignee, setAssignee] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [labelInput, setLabelInput] = useState('');
  const [labels, setLabels] = useState([]);
  const [saving, setSaving] = useState(false);

  const handleAddLabel = (e) => {
    if (e.key === 'Enter' && labelInput.trim()) {
      setLabels((l) => [...l, labelInput.trim()]);
      setLabelInput('');
    }
  };

  const reset = () => {
    setTitle(''); setPriority('none'); setAssignee('');
    setDueDate(''); setLabels([]); setLabelInput('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      const { data } = await taskAPI.create({
        title: title.trim(), column: columnId, project: projectId,
        priority, assignee: assignee || undefined,
        dueDate: dueDate || undefined, labels,
      });
      addTask(data);
      reset();
      onClose();
      toast.success('Task created!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create task');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={() => { reset(); onClose(); }} title="Add New Task">
      <form onSubmit={handleSubmit} className="modal-body">
        <div className="form-group">
          <label className="form-label">Title *</label>
          <input
            className="form-input"
            placeholder="Task title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
            id="new-task-title"
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <div className="form-group">
            <label className="form-label">Priority</label>
            <select className="form-select" value={priority} onChange={(e) => setPriority(e.target.value)} id="new-task-priority">
              {Object.entries(PRIORITY_META).map(([k, v]) => (
                <option key={k} value={k}>{v.icon} {v.label}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Due Date</label>
            <input
              className="form-input"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              id="new-task-due"
            />
          </div>
        </div>

        {members.length > 0 && (
          <div className="form-group">
            <label className="form-label">Assignee</label>
            <select className="form-select" value={assignee} onChange={(e) => setAssignee(e.target.value)} id="new-task-assignee">
              <option value="">Unassigned</option>
              {members.map((m) => (
                <option key={m.user._id} value={m.user._id}>{m.user.name}</option>
              ))}
            </select>
          </div>
        )}

        <div className="form-group">
          <label className="form-label">Labels (press Enter to add)</label>
          <div className="tag-input-container">
            {labels.map((l) => (
              <span key={l} className="tag-chip">
                {l}
                <button type="button" className="tag-chip-remove" onClick={() => setLabels((ls) => ls.filter((x) => x !== l))}>×</button>
              </span>
            ))}
            <input
              className="form-input"
              style={{ flex: 1, minWidth: '100px' }}
              placeholder="Add label..."
              value={labelInput}
              onChange={(e) => setLabelInput(e.target.value)}
              onKeyDown={handleAddLabel}
              id="new-task-label"
            />
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={() => { reset(); onClose(); }}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={saving || !title.trim()}>
            {saving ? <span className="spinner" /> : 'Create Task'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
