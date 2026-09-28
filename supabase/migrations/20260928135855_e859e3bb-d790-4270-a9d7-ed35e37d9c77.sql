ALTER TABLE public.quizzes ADD COLUMN kind TEXT NOT NULL DEFAULT 'practice', ADD COLUMN pattern TEXT, ADD COLUMN time_limit_seconds INTEGER, ADD COLUMN negative_marking NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE public.quiz_questions ADD COLUMN section TEXT;
CREATE INDEX quizzes_user_kind_idx ON public.quizzes(user_id, kind, created_at DESC);