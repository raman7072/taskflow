import { useState } from 'react';
import {
  DndContext,
  closestCorners,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import Column from './Column.jsx';
import TaskCard from './TaskCard.jsx';
import TaskDrawer from './TaskDrawer.jsx';
import AddTaskModal from './AddTaskModal.jsx';
import { useBoardStore } from '../../store/boardStore.js';
import { taskAPI, columnAPI } from '../../api/services.js';
import toast from 'react-hot-toast';

const WIP_LIMIT = 6; // warn when a column exceeds this

export default function KanbanBoard({ project, members }) {
  const { columns, tasks, moveTask, updateTask, addColumn, setColumns, getTasksForColumn } = useBoardStore();
  const [activeTask, setActiveTask] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [addingToColumn, setAddingToColumn] = useState(null);
  const [newColumnName, setNewColumnName] = useState('');
  const [addingColumn, setAddingColumn] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const handleDragStart = ({ active }) => {
    const task = tasks.find((t) => t._id === active.id);
    setActiveTask(task || null);
  };

  const handleDragEnd = async ({ active, over }) => {
    setActiveTask(null);
    if (!over || active.id === over.id) return;

    const draggedTask = tasks.find((t) => t._id === active.id);
    if (!draggedTask) return;

    let targetColumnId = over.id;
    const overTask = tasks.find((t) => t._id === over.id);
    if (overTask) targetColumnId = overTask.column?._id || overTask.column;

    const sourceColumnId = draggedTask.column?._id || draggedTask.column;
    const targetTasks = getTasksForColumn(targetColumnId).filter((t) => t._id !== active.id);
    const overIndex = overTask ? targetTasks.findIndex((t) => t._id === over.id) : targetTasks.length;
    const newOrder = overIndex >= 0 ? overIndex : targetTasks.length;

    moveTask(active.id, targetColumnId, newOrder);

    try {
      await taskAPI.move(active.id, { column: targetColumnId, order: newOrder });
    } catch {
      toast.error('Failed to move task');
    }
  };

  const handleAddColumn = async (e) => {
    e.preventDefault();
    if (!newColumnName.trim()) return;
    try {
      const { data } = await columnAPI.create({ name: newColumnName.trim(), project: project._id, color: '#6366f1' });
      addColumn(data);
      setNewColumnName('');
      setAddingColumn(false);
    } catch {
      toast.error('Failed to create column');
    }
  };

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="board-columns">
          {columns.map((col) => {
            const colTasks = getTasksForColumn(col._id);
            return (
              <Column
                key={col._id}
                column={col}
                tasks={colTasks}
                onTaskClick={setSelectedTask}
                onAddTask={(columnId) => setAddingToColumn(columnId)}
                wipWarning={colTasks.length >= WIP_LIMIT}
              />
            );
          })}

          {/* Add Column */}
          <div style={{ width: '230px', flexShrink: 0 }}>
            {addingColumn ? (
              <form
                onSubmit={handleAddColumn}
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-hover)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  boxShadow: 'var(--shadow-sm), 2px 3px 0 rgba(20,16,8,0.05)',
                }}
              >
                <input
                  className="form-input"
                  placeholder="Column name..."
                  value={newColumnName}
                  onChange={(e) => setNewColumnName(e.target.value)}
                  autoFocus
                  id="new-column-input"
                />
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button type="submit" className="btn btn-primary btn-sm" style={{ flex: 1 }}>Add</button>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setAddingColumn(false)}>✕</button>
                </div>
              </form>
            ) : (
              <button
                className="btn btn-secondary"
                style={{
                  width: '100%',
                  borderStyle: 'dashed',
                  borderColor: 'var(--border-hover)',
                  color: 'var(--text-muted)',
                  letterSpacing: '0.03em',
                  fontSize: '12.5px',
                }}
                onClick={() => setAddingColumn(true)}
                id="add-column-btn"
              >
                ＋ Add Column
              </button>
            )}
          </div>
        </div>

        <DragOverlay>
          {activeTask && <TaskCard task={activeTask} onClick={() => {}} />}
        </DragOverlay>
      </DndContext>

      {/* Task Drawer */}
      {selectedTask && (
        <TaskDrawer
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          members={members}
        />
      )}

      {/* Add Task Modal */}
      <AddTaskModal
        isOpen={!!addingToColumn}
        onClose={() => setAddingToColumn(null)}
        columnId={addingToColumn}
        projectId={project._id}
        members={members}
      />
    </>
  );
}
