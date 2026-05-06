CREATE TABLE IF NOT EXISTS public.admin_email_allowlist (
  email text PRIMARY KEY,
  role public.app_role NOT NULL DEFAULT 'admin',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT admin_email_allowlist_email_lowercase CHECK (email = lower(email))
);

ALTER TABLE public.admin_email_allowlist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view admin email allowlist" ON public.admin_email_allowlist;
DROP POLICY IF EXISTS "Admins can manage admin email allowlist" ON public.admin_email_allowlist;

INSERT INTO public.admin_email_allowlist (email, role)
VALUES ('giorgiomauro63@gmail.com', 'admin')
ON CONFLICT (email) DO UPDATE SET role = EXCLUDED.role;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
  OR EXISTS (
    SELECT 1
    FROM public.admin_email_allowlist
    WHERE email = lower(coalesce(auth.jwt() ->> 'email', ''))
      AND role = _role
  )
$function$;

CREATE POLICY "Admins can view admin email allowlist"
ON public.admin_email_allowlist
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can manage admin email allowlist"
ON public.admin_email_allowlist
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));