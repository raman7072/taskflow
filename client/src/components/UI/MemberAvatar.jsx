export default function MemberAvatar({ user, size = 'sm', showTooltip = false }) {
  if (!user) return null;

  const initials = user.name
    ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  // Desaturate avatar colors for paper theme
  const rawColor = user.avatarColor || '#6366f1';

  return (
    <div
      className={`avatar avatar-${size}`}
      style={{
        backgroundColor: rawColor,
        filter: 'saturate(0.45) brightness(0.75)',
      }}
      title={showTooltip ? user.name : undefined}
    >
      {initials}
    </div>
  );
}
