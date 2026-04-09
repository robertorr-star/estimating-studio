import { Star, Archive, Zap, ShieldCheck, Eye, Gavel } from 'lucide-react';

type Status = 'draft' | 'submitted_to_sigfried' | 'sigfried_approved' | 'leo_approved' | 'robert_approved' |
  'rejected' | 'signed' | 'converted_to_project' | 'archived' | 'active_project' |
  // legacy statuses for backward compat
  'submitted' | 'under_review' | 'approved';

const STATUS_CONFIG: Record<string, { label: string; className: string; pulse?: boolean; icon?: string }> = {
  draft: { label: 'DRAFT', className: 'bg-muted text-muted-foreground border-border' },
  submitted_to_sigfried: { label: 'PENDING SIGFRIED', className: 'bg-info/15 text-info border-info/30', pulse: true },
  sigfried_approved: { label: 'SIGFRIED ✓ → LEO', className: 'bg-primary/15 text-primary border-primary/30', pulse: true, icon: 'eye' },
  leo_approved: { label: 'LEO ✓ → ROBERT', className: 'bg-warning/15 text-warning border-warning/30', pulse: true, icon: 'gavel' },
  robert_approved: { label: 'APPROVED', className: 'bg-success/15 text-success border-success/30', icon: 'shield' },
  rejected: { label: 'REJECTED', className: 'bg-destructive/15 text-destructive border-destructive/30' },
  signed: { label: 'SIGNED', className: 'bg-success/15 text-success border-success/30', icon: 'star' },
  converted_to_project: { label: 'CONVERTED', className: 'bg-info/20 text-info border-info/40' },
  archived: { label: 'ARCHIVED', className: 'bg-muted text-muted-foreground border-border', icon: 'archive' },
  active_project: { label: 'ACTIVE PROJECT', className: 'bg-teal-500/15 text-teal-400 border-teal-500/30', icon: 'zap' },
  // Legacy
  submitted: { label: 'SUBMITTED', className: 'bg-info/15 text-info border-info/30', pulse: true },
  under_review: { label: 'UNDER REVIEW', className: 'bg-primary/15 text-primary border-primary/30', pulse: true },
  approved: { label: 'APPROVED', className: 'bg-success/15 text-success border-success/30', icon: 'shield' },
};

const iconMap: Record<string, any> = {
  star: Star,
  archive: Archive,
  zap: Zap,
  shield: ShieldCheck,
  eye: Eye,
  gavel: Gavel,
};

const StatusBadge = ({ status }: { status: string }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
  const Icon = config.icon ? iconMap[config.icon] : null;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-mono font-bold tracking-wider rounded border ${config.className} ${config.pulse ? 'animate-blue-pulse' : ''}`}>
      {Icon && <Icon className="h-2.5 w-2.5" />}
      {config.label}
    </span>
  );
};

export default StatusBadge;
