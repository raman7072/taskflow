import { useState } from 'react';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import TaskCard from './TaskCard.jsx';
import { columnAPI } from '../../api/services.js';
import { useBoardStore } from '../../store/boardStore.js';
import toast from 'react-hot-toast';

const WIP_LIMIT = 6;

export default function Column({ column, tasks, onTaskClick, onAddTask, wipWarning }) {
  const [editing, setEditing] = useState(false);
  const [colName, setColName] = useState(column.name);
  const { updateColumn, removeColumn } = useBoardStore();

  const { setNodeRef, isOver } = useDroppable({ id: column._id });

  const handleRename = async () => {
    setEditing(false);
    if (colName.trim() === column.name) return;
    try {
      const { data } = await columnAPI.update(column._id, { name: colName.trim() });
      updateColumn(data);
    } catch {
      setColName(column.name);
      toast.error('Failed to rename column');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete column "${column.name}" and all its tasks?`)) return;
    try {
      await columnAPI.delete(column._id);
      removeColumn(column._id);
      toast.success('Column deleted');
    } catch {
      toast.error('Failed to delete column');
    }
  };

  return (
    <div
      className={`column ${isOver ? 'drag-over' : ''} ${wipWarning ? 'column-wip-warn' : ''}`}
      id={`column-${column._id}`}
    >
      <div className="column-header">
        <div className="column-title-row">
          <div className="column-dot" style={{ background: column.color }} />
          {editing ? (
            <input
              className="form-input"
              style={{ padding: '4px 8px', fontSize: '12px', height: '26px' }}
              value={colName}
              onChange={(e) => setColName(e.target.value)}
              onBlur={handleRename}
              onKeyDown={(e) => e.key === 'Enter' && handleRename()}
              autoFocus
            />
          ) : (
            <span className="column-name" onDoubleClick={() => setEditing(true)} title="Double-click to rename">
              {column.name}
            </span>
          )}
          <span className="column-count" title={wipWarning ? `WIP limit reached (≥ ${WIP_LIMIT} tasks)` : ''}>
            {tasks.length}{wipWarning ? ' !' : ''}
          </span>
        </div>
        <button
          className="btn btn-ghost btn-sm btn-icon"
          onClick={handleDelete}
          title="Delete column"
          style={{ fontSize: '12px', color: 'var(--text-muted)', padding: '3px 5px' }}
        >
          ✕
        </button>
      </div>

      <SortableContext items={tasks.map((t) => t._id)} strategy={verticalListSortingStrategy}>
        <div ref={setNodeRef} className="column-tasks">
          {tasks.map((task) => (
            <TaskCard key={task._id} task={task} onClick={onTaskClick} />
          ))}
          {tasks.length === 0 && (
            <div style={{
              padding: '24px 0', textAlign: 'center',
              color: 'var(--text-muted)', fontSize: '11.5px',
              borderRadius: 'var(--radius)', border: '1px dashed var(--border)',
              letterSpacing: '0.04em',
            }}>
              Drop tasks here
            </div>
          )}
        </div>
      </SortableContext>

      <button className="column-add-btn" onClick={() => onAddTask(column._id)}>
        ＋ Add Task
      </button>
    </div>
  );
}
