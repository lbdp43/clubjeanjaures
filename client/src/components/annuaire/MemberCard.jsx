import { Link } from 'react-router-dom';

export default function MemberCard({ member, compact }) {
  return (
    <Link to={`/annuaire/${member.id}`} className="card hover:shadow-md transition-shadow block">
      <div className="flex items-center gap-4">
        {member.logoUrl ? (
          <img src={member.logoUrl} alt={member.companyName} className="w-14 h-14 rounded-full object-cover" />
        ) : (
          <div className="w-14 h-14 rounded-full bg-blue-light flex items-center justify-center text-blue font-bold text-lg">
            {member.companyName?.charAt(0) || '?'}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-text-main truncate">{member.companyName}</h3>
          <p className="text-sm text-text-muted truncate">{member.jobTitle}</p>
          {!compact && member.city && (
            <p className="text-xs text-text-muted mt-1">{member.city}</p>
          )}
        </div>
      </div>
    </Link>
  );
}
