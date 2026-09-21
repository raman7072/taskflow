import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { projectAPI, workspaceAPI } from '../api/services.js';
import { useBoardStore } from '../store/boardStore.js';
import { useSocket } from '../context/SocketContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import KanbanBoard from '../components/Board/KanbanBoard.jsx';
import MemberAvatar from '../components/UI/MemberAvatar.jsx';

export default function BoardPage() {
  const { projectId } = useParams();
  const { user } = useAuth();
  const { socket } = useSocket();
  const { loadBoard, loading, addTask, updateTask, removeTask, addColumn, updateColumn, removeColumn } = useBoardStore();
  const [project, setProject] = useState(null);
  const [members, setMembers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    if (!projectId) return;

    // Load project info
    projectAPI.getOne(projectId).then(({ data }) => {
      setProject(data);
      // Load workspace members
      workspaceAPI.getOne(data.workspace).then(({ data: ws }) => {
        setMembers(ws.members || []);
      });
    });

    // Load board data
    loadBoard(projectId);
  }, [projectId]);

  // Socket.io real-time sync
  useEffect(() => {
    if (!socket || !projectId || !user) return;

    socket.emit('board:join', { projectId, userId: user._id, userName: user.name });

    socket.on('task:created', addTask);
    socket.on('task:updated', updateTask);
    socket.on('task:moved', updateTask);
    socket.on('task:deleted', ({ _id }) => removeTask(_id));
    socket.on('column:created', addColumn);
    socket.on('column:updated', updateColumn);
    socket.on('column:deleted', ({ _id }) => removeColumn(_id));
    socket.on('board:presence', setOnlineUsers);

    return () => {
      socket.emit('board:leave', { projectId });
      socket.off('task:created');
      socket.off('task:updated');
      socket.off('task:moved');
      socket.off('task:deleted');
      socket.off('column:created');
      socket.off('column:updated');
      socket.off('column:deleted');
      socket.off('board:presence');
    };
  }, [socket, projectId, user]);

  if (loading || !project) {
    return (
      <div className="loading-screen">
        <div className="spinner spinner-lg" />
        <span>Loading board...</span>
      </div>
    );
  }

  const otherOnlineUsers = onlineUsers.filter((u) => u.userId !== user?._id);

  return (
    <div className="board-page">
      {/* Board Header */}
      <div className="board-header">
        <div
          className="board-project-icon"
          style={{
            background: project.color ? `${project.color}22` : 'rgba(20,16,8,0.08)',
            border: '1px solid var(--border-hover)',
            filter: 'saturate(0.4) brightness(0.85)',
          }}
        >
          {project.icon || '📋'}
        </div>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: '17px', fontWeight: 400, marginBottom: '2px', fontFamily: 'var(--font-display)', letterSpacing: '0.01em' }}>
            {project.name}
          </h1>
          {project.description && (
            <p style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>{project.description}</p>
          )}
        </div>

        {/* Online presence */}
        {otherOnlineUsers.length > 0 && (
          <div className="presence-bar">
            <div className="presence-dot" />
            <div className="avatar-stack">
              {otherOnlineUsers.slice(0, 4).map((u) => (
                <div
                  key={u.userId}
                  className="avatar avatar-sm"
                  style={{ backgroundColor: '#6b6560', filter: 'saturate(0.25) brightness(0.75)' }}
                  title={u.userName}
                >
                  {u.userName?.slice(0, 2).toUpperCase()}
                </div>
              ))}
            </div>
            <span style={{ fontSize: '11.5px' }}>
              {otherOnlineUsers.length} online
            </span>
          </div>
        )}
      </div>

      {/* Kanban Board */}
      <div className="board-columns-wrapper">
        <KanbanBoard project={project} members={members} />
      </div>
    </div>
  );
}
