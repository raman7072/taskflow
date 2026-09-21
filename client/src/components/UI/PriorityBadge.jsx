export const PRIORITY_META = {
  urgent: { label: 'Urgent',      icon: '▲▲' },
  high:   { label: 'High',        icon: '▲'  },
  medium: { label: 'Medium',      icon: '◆'  },
  low:    { label: 'Low',         icon: '▽'  },
  none:   { label: 'No priority', icon: '—'  },
};

export default function PriorityBadge({ priority = 'none', showIcon = true }) {
  const meta = PRIORITY_META[priority] || PRIORITY_META.none;
  return (
    <span className={`priority-badge ${priority}`}>
      {showIcon && <span style={{ fontSize: '8px', letterSpacing: '-0.5px' }}>{meta.icon}</span>}
      {meta.label}
    </span>
  );
}
