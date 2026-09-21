import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { format, isPast, isWithinInterval, addDays } from 'date-fns';
import MemberAvatar from '../UI/MemberAvatar.jsx';
import PriorityBadge from '../UI/PriorityBadge.jsx';
import { taskAPI } from '../../api/services.js';
import { useBoardStore } from '../../store/boardStore.js';
import toast from 'react-hot-toast';

export default function TaskCard({ task, onClick }) {
  const {
    attributes, listeners, setNodeRef, transform, transition, isDragging,
  } = useSortable({ id: task._id });
  const { removeTask } = useBoardStore();
  const [deleting, setDeleting] = useState(false);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && !task.completed;
  const isSoon = task.dueDate && !isOverdue &&
    isWithinInterval(new Date(task.dueDate), { start: new Date(), end: addDays(new Date(), 2) });

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!window.confirm(`Delete "${task.title}"?`)) return;
    setDeleting(true);
    try {
      await taskAPI.delete(task._id);
      removeTask(task._id);
      toast.success('Task deleted');
    } catch {
      toast.error('Failed to delete task');
      setDeleting(false);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`task-card priority-${task.priority || 'none'} ${isDragging ? 'dragging' : ''}`}
      onClick={() => onClick(task)}
      id={`task-${task._id}`}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick(task)}
    >
      {/* Inline delete — appears on card hover */}
      <button
        className="task-card-delete"
        onClick={handleDelete}
        disabled={deleting}
        title="Delete task"
        id={`delete-task-${task._id}`}
      >
        {deleting ? '…' : '🗑'}
      </button>

      {/* Labels */}
      {task.labels?.length > 0 && (
        <div className="task-labels">
          {task.labels.slice(0, 3).map((l) => (
            <span key={l} className="task-label">{l}</span>
          ))}
        </div>
      )}

      <p className="task-card-title">{task.title}</p>

      <div className="task-card-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {task.priority && task.priority !== 'none' && (
            <PriorityBadge priority={task.priority} showIcon />
          )}
          {task.dueDate && (
            <span className={`due-date ${isOverdue ? 'overdue' : isSoon ? 'soon' : ''}`}>
              📅 {format(new Date(task.dueDate), 'MMM d')}
            </span>
          )}
        </div>
        {task.assignee && <MemberAvatar user={task.assignee} size="sm" showTooltip />}
      </div>

      {task.comments?.length > 0 && (
        <div style={{ marginTop: '6px', fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
          💬 {task.comments.length}
        </div>
      )}
    </div>
  );
}
