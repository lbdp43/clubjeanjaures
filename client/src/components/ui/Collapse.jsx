// Déploiement fluide en hauteur (grid-template-rows 0fr → 1fr, sans mesurer le contenu).
// Le contenu reste monté ; replié, il est inerte (ni focus ni lecture d'écran).
export default function Collapse({ open, children, className = '' }) {
  return (
    <div
      className={`expand ${open ? "expand-open" : ""} ${className}`}
      aria-hidden={!open}
      {...(!open ? { inert: '' } : {})}
    >
      <div className="expand-inner">{children}</div>
    </div>
  );
}
