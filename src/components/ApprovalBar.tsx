import { useState } from 'react';
import { Send, CheckCircle, RotateCcw, XCircle, AlertTriangle, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ApprovalBarProps {
  status: string;
  grossMargin: number;
  builtBy: string;
  builtCompletedAt?: string | null;
  sigfriedApprovedAt?: string | null;
  leoApprovedAt?: string | null;
  robertApprovedAt?: string | null;
  onStatusChange: (newStatus: string) => void;
}

const MARGIN_FLOOR = () => {
  const stored = localStorage.getItem('marginFloor');
  return stored ? parseFloat(stored) : 28;
};

const formatTimestamp = (ts?: string | null) => {
  if (!ts) return null;
  const d = new Date(ts);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' +
    d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
};

const timeSince = (from?: string | null) => {
  if (!from) return '';
  const ms = Date.now() - new Date(from).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ${mins % 60}m`;
  const days = Math.floor(hours / 24);
  return `${days}d ${hours % 24}h`;
};

const timeBetween = (from?: string | null, to?: string | null) => {
  if (!from || !to) return '—';
  const ms = new Date(to).getTime() - new Date(from).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ${mins % 60}m`;
  const days = Math.floor(hours / 24);
  return `${days}d ${hours % 24}h`;
};

type Stage = {
  key: string;
  label: string;
  who?: string;
  completedAt?: string | null;
  duration?: string;
  active?: boolean;
};

const ApprovalBar = ({
  status, grossMargin, builtBy,
  builtCompletedAt, sigfriedApprovedAt, leoApprovedAt, robertApprovedAt,
  onStatusChange,
}: ApprovalBarProps) => {
  const [overrideOpen, setOverrideOpen] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  const marginFloor = MARGIN_FLOOR();
  const belowFloor = grossMargin > 0 && grossMargin < marginFloor;
  const isSigfried = builtBy === 'Sigfried';

  const handleApproveClick = (action: string) => {
    if (belowFloor) {
      setPendingAction(action);
      setOverrideOpen(true);
    } else {
      onStatusChange(action);
    }
  };

  const handleOverrideConfirm = () => {
    if (!overrideReason.trim()) return;
    if (pendingAction) onStatusChange(pendingAction);
    setOverrideOpen(false);
    setOverrideReason('');
    setPendingAction(null);
  };

  // Build 4-stage timeline
  const stages: Stage[] = [];

  // Stage 1 — Estimator builds
  const s1Complete = builtCompletedAt || (isSigfried && sigfriedApprovedAt);
  stages.push({
    key: 'built',
    label: 'ESTIMATOR',
    who: builtBy,
    completedAt: builtCompletedAt,
    duration: builtCompletedAt ? formatTimestamp(builtCompletedAt) || '' : undefined,
    active: status === 'draft',
  });

  // Stage 2 — Sigfried approval
  stages.push({
    key: 'sigfried',
    label: 'SIGFRIED',
    who: 'Sigfried',
    completedAt: sigfriedApprovedAt,
    duration: sigfriedApprovedAt
      ? timeBetween(builtCompletedAt || sigfriedApprovedAt, sigfriedApprovedAt)
      : (status === 'submitted_to_sigfried' ? timeSince(builtCompletedAt) : undefined),
    active: status === 'submitted_to_sigfried' || (isSigfried && status === 'draft'),
  });

  // Stage 3 — Leo field review
  stages.push({
    key: 'leo',
    label: 'LEO',
    who: 'Leo',
    completedAt: leoApprovedAt,
    duration: leoApprovedAt
      ? timeBetween(sigfriedApprovedAt, leoApprovedAt)
      : (status === 'sigfried_approved' ? timeSince(sigfriedApprovedAt) : undefined),
    active: status === 'sigfried_approved',
  });

  // Stage 4 — Robert final
  stages.push({
    key: 'robert',
    label: 'ROBERT',
    who: 'Robert',
    completedAt: robertApprovedAt,
    duration: robertApprovedAt
      ? timeBetween(leoApprovedAt, robertApprovedAt)
      : (status === 'leo_approved' ? timeSince(leoApprovedAt) : undefined),
    active: status === 'leo_approved',
  });

  const getStageStatus = (stage: Stage): 'done' | 'active' | 'pending' => {
    if (stage.completedAt) return 'done';
    if (stage.active) return 'active';
    return 'pending';
  };

  return (
    <>
      {/* Margin Alert Banner */}
      {belowFloor && !['archived', 'active_project', 'robert_approved'].includes(status) && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 mb-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-destructive">
              ⚠️ MARGIN ALERT — Below OCD's minimum {marginFloor}% margin floor.
            </p>
            <p className="text-xs text-destructive/80 mt-1">
              At {grossMargin.toFixed(1)}% this job will not fully cover overhead and owner salary.
            </p>
          </div>
        </div>
      )}

      <div className="rounded-lg border border-border bg-card p-3 mb-4">
        {/* 4-Stage Timeline Strip */}
        <div className="flex items-center gap-0 mb-3">
          {stages.map((stage, i) => {
            const stageStatus = getStageStatus(stage);
            return (
              <div key={stage.key} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold border-2 ${
                    stageStatus === 'done'
                      ? 'bg-success border-success text-success-foreground'
                      : stageStatus === 'active'
                        ? 'bg-warning/20 border-warning text-warning animate-pulse'
                        : 'bg-muted border-border text-muted-foreground'
                  }`}>
                    {stageStatus === 'done' ? '✓' : i + 1}
                  </div>
                  <span className={`text-[8px] font-mono font-bold mt-1 tracking-wider ${
                    stageStatus === 'done' ? 'text-success' :
                    stageStatus === 'active' ? 'text-warning' :
                    'text-muted-foreground'
                  }`}>
                    {stage.label}
                  </span>
                  <span className="text-[7px] font-mono text-muted-foreground">
                    {stage.who || ''}
                  </span>
                  {stage.duration && (
                    <span className={`text-[7px] font-mono ${
                      stageStatus === 'active' ? 'text-warning' : 'text-muted-foreground'
                    }`}>
                      {stageStatus === 'active' ? `⏱ ${stage.duration}` : stage.duration}
                    </span>
                  )}
                  {stage.completedAt && (
                    <span className="text-[7px] font-mono text-muted-foreground">
                      {formatTimestamp(stage.completedAt)}
                    </span>
                  )}
                </div>
                {i < stages.length - 1 && (
                  <div className={`h-0.5 w-full mx-1 ${
                    getStageStatus(stages[i + 1]) !== 'pending' || stageStatus === 'done'
                      ? 'bg-success'
                      : stageStatus === 'active' ? 'bg-warning/50' : 'bg-border'
                  }`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Built-by info */}
        {builtBy && (
          <div className="text-[9px] font-mono text-muted-foreground mb-2 px-1">
            Built by <span className="text-foreground font-bold">{builtBy}</span>
            {builtCompletedAt && <> — submitted {formatTimestamp(builtCompletedAt)}</>}
            {status === 'robert_approved' && robertApprovedAt && builtCompletedAt && (
              <> — Total cycle: <span className="text-success font-bold">{timeBetween(builtCompletedAt, robertApprovedAt)}</span></>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/50">
          {/* Stage 1: Draft — estimator submits */}
          {status === 'draft' && !isSigfried && (
            <button
              onClick={() => onStatusChange('submitted_to_sigfried')}
              className="flex items-center gap-2 px-4 min-h-[48px] sm:min-h-0 sm:py-1.5 text-[11px] sm:text-[10px] font-mono font-bold bg-info/15 text-info border border-info/30 rounded hover:bg-info/25 active:bg-info/35 transition-colors uppercase tracking-wider"
            >
              <Send className="h-4 w-4 sm:h-3 sm:w-3" /> Submit to Sigfried
            </button>
          )}

          {/* Stage 1+2 merged: Sigfried built it himself */}
          {status === 'draft' && isSigfried && (
            <button
              onClick={() => handleApproveClick('sigfried_approved')}
              className="flex items-center gap-2 px-4 min-h-[48px] sm:min-h-0 sm:py-1.5 text-[11px] sm:text-[10px] font-mono font-bold bg-success/15 text-success border border-success/30 rounded hover:bg-success/25 active:bg-success/35 transition-colors uppercase tracking-wider"
            >
              <CheckCircle className="h-4 w-4 sm:h-3 sm:w-3" /> Approve to Leo
            </button>
          )}

          {/* Stage 2: Sigfried reviews */}
          {status === 'submitted_to_sigfried' && (
            <>
              <button
                onClick={() => handleApproveClick('sigfried_approved')}
                className="flex items-center gap-2 px-4 min-h-[48px] sm:min-h-0 sm:py-1.5 text-[11px] sm:text-[10px] font-mono font-bold bg-success/15 text-success border border-success/30 rounded hover:bg-success/25 active:bg-success/35 transition-colors uppercase tracking-wider"
              >
                <CheckCircle className="h-4 w-4 sm:h-3 sm:w-3" /> Approve to Leo
              </button>
              <button
                onClick={() => onStatusChange('draft')}
                className="flex items-center gap-2 px-4 min-h-[48px] sm:min-h-0 sm:py-1.5 text-[11px] sm:text-[10px] font-mono font-bold bg-warning/15 text-warning border border-warning/30 rounded hover:bg-warning/25 active:bg-warning/35 transition-colors uppercase tracking-wider"
              >
                <RotateCcw className="h-4 w-4 sm:h-3 sm:w-3" /> Send Back
              </button>
            </>
          )}

          {/* Stage 3: Leo reviews */}
          {status === 'sigfried_approved' && (
            <>
              <button
                onClick={() => handleApproveClick('leo_approved')}
                className="flex items-center gap-2 px-4 min-h-[48px] sm:min-h-0 sm:py-1.5 text-[11px] sm:text-[10px] font-mono font-bold bg-success/15 text-success border border-success/30 rounded hover:bg-success/25 active:bg-success/35 transition-colors uppercase tracking-wider"
              >
                <CheckCircle className="h-4 w-4 sm:h-3 sm:w-3" /> Leo Approve to Robert
              </button>
              <button
                onClick={() => onStatusChange('sigfried_send_back')}
                className="flex items-center gap-2 px-4 min-h-[48px] sm:min-h-0 sm:py-1.5 text-[11px] sm:text-[10px] font-mono font-bold bg-warning/15 text-warning border border-warning/30 rounded hover:bg-warning/25 active:bg-warning/35 transition-colors uppercase tracking-wider"
              >
                <RotateCcw className="h-4 w-4 sm:h-3 sm:w-3" /> Send Back
              </button>
            </>
          )}

          {/* Stage 4: Robert final */}
          {status === 'leo_approved' && (
            <>
              <button
                onClick={() => handleApproveClick('robert_approved')}
                className="flex items-center gap-2 px-4 min-h-[48px] sm:min-h-0 sm:py-1.5 text-[11px] sm:text-[10px] font-mono font-bold bg-success/15 text-success border border-success/30 rounded hover:bg-success/25 active:bg-success/35 transition-colors uppercase tracking-wider"
              >
                <CheckCircle className="h-4 w-4 sm:h-3 sm:w-3" /> Approve
              </button>
              <button
                onClick={() => onStatusChange('leo_send_back')}
                className="flex items-center gap-2 px-4 min-h-[48px] sm:min-h-0 sm:py-1.5 text-[11px] sm:text-[10px] font-mono font-bold bg-warning/15 text-warning border border-warning/30 rounded hover:bg-warning/25 active:bg-warning/35 transition-colors uppercase tracking-wider"
              >
                <RotateCcw className="h-4 w-4 sm:h-3 sm:w-3" /> Request Revisions
              </button>
              <button
                onClick={() => onStatusChange('rejected')}
                className="flex items-center gap-2 px-4 min-h-[48px] sm:min-h-0 sm:py-1.5 text-[11px] sm:text-[10px] font-mono font-bold bg-destructive/15 text-destructive border border-destructive/30 rounded hover:bg-destructive/25 active:bg-destructive/35 transition-colors uppercase tracking-wider"
              >
                <XCircle className="h-4 w-4 sm:h-3 sm:w-3" /> Reject
              </button>
            </>
          )}

          {/* Post-approval: Robert approved → can convert */}
          {status === 'robert_approved' && (
            <button
              onClick={() => onStatusChange('active_project')}
              className="flex items-center gap-2 px-4 min-h-[48px] sm:min-h-0 sm:py-1.5 text-[11px] sm:text-[10px] font-mono font-bold bg-teal-500/15 text-teal-400 border border-teal-500/30 rounded hover:bg-teal-500/25 active:bg-teal-500/35 transition-colors uppercase tracking-wider"
            >
              <ArrowRight className="h-4 w-4 sm:h-3 sm:w-3" /> Activate as Project
            </button>
          )}
        </div>
      </div>

      {/* Override Dialog */}
      <AlertDialog open={overrideOpen} onOpenChange={setOverrideOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Margin Below Floor — Override Required
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                This estimate has a gross margin of <strong>{grossMargin.toFixed(1)}%</strong>, which is below
                OCD's minimum margin floor of <strong>{marginFloor}%</strong>.
              </p>
              <p className="font-medium">Please provide a reason for the override:</p>
              <Input
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                placeholder="e.g. Strategic relationship, volume discount expected..."
                className="mt-2"
              />
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleOverrideConfirm}
              disabled={!overrideReason.trim()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              OVERRIDE — I UNDERSTAND THE RISK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ApprovalBar;
