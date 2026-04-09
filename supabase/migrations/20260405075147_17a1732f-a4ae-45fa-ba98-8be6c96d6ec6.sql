ALTER TABLE public.estimate_projects DROP CONSTRAINT estimate_projects_status_check;

ALTER TABLE public.estimate_projects ADD CONSTRAINT estimate_projects_status_check
  CHECK (status = ANY (ARRAY[
    'draft', 'submitted', 'under_review', 'approved', 'rejected', 'signed', 'converted_to_project',
    'submitted_to_sigfried', 'sigfried_approved', 'leo_approved', 'robert_approved',
    'active_project', 'archived'
  ]));