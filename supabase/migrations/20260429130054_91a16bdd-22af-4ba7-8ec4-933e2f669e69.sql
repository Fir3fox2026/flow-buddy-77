CREATE TABLE public.monthly_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  month TEXT NOT NULL,
  salary NUMERIC NOT NULL DEFAULT 0,
  total_income NUMERIC NOT NULL DEFAULT 0,
  total_fixed NUMERIC NOT NULL DEFAULT 0,
  total_variable NUMERIC NOT NULL DEFAULT 0,
  balance NUMERIC NOT NULL DEFAULT 0,
  snapshot JSONB NOT NULL DEFAULT '[]'::jsonb,
  closed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, month)
);

ALTER TABLE public.monthly_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reports"
ON public.monthly_reports
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reports"
ON public.monthly_reports
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reports"
ON public.monthly_reports
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reports"
ON public.monthly_reports
FOR DELETE
USING (auth.uid() = user_id);

CREATE TRIGGER set_monthly_reports_updated_at
BEFORE UPDATE ON public.monthly_reports
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_monthly_reports_user_month ON public.monthly_reports (user_id, month DESC);