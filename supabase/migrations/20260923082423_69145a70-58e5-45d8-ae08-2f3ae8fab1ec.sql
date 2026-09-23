
CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

-- profiles
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name TEXT,
  target_exam TEXT NOT NULL DEFAULT 'IBPS PO',
  exam_date DATE,
  level INT NOT NULL DEFAULT 1,
  language TEXT NOT NULL DEFAULT 'en',
  daily_hours NUMERIC NOT NULL DEFAULT 6,
  streak_days INT NOT NULL DEFAULT 0,
  last_active_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile" ON public.profiles FOR ALL TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE TRIGGER profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name) VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- subject / topic library
CREATE TABLE public.subjects (
  id TEXT NOT NULL PRIMARY KEY,
  name TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0
);
GRANT SELECT ON public.subjects TO authenticated, anon;
GRANT ALL ON public.subjects TO service_role;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subjects readable" ON public.subjects FOR SELECT TO authenticated, anon USING (true);

CREATE TABLE public.topics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subject_id TEXT NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0
);
CREATE INDEX topics_subject_idx ON public.topics(subject_id);
GRANT SELECT ON public.topics TO authenticated, anon;
GRANT ALL ON public.topics TO service_role;
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "topics readable" ON public.topics FOR SELECT TO authenticated, anon USING (true);

-- coach conversations
CREATE TABLE public.chat_threads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'New conversation',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX chat_threads_user_idx ON public.chat_threads(user_id, updated_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_threads TO authenticated;
GRANT ALL ON public.chat_threads TO service_role;
ALTER TABLE public.chat_threads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own threads" ON public.chat_threads FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER chat_threads_updated BEFORE UPDATE ON public.chat_threads FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  thread_id UUID NOT NULL REFERENCES public.chat_threads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  role TEXT NOT NULL,
  parts JSONB NOT NULL DEFAULT '[]'::jsonb,
  sdk_message_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX chat_messages_thread_idx ON public.chat_messages(thread_id, created_at);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_messages TO authenticated;
GRANT ALL ON public.chat_messages TO service_role;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own messages" ON public.chat_messages FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- quizzes
CREATE TABLE public.quizzes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  subject_id TEXT,
  topic TEXT NOT NULL,
  difficulty INT NOT NULL DEFAULT 1,
  mode TEXT NOT NULL DEFAULT 'practice',
  status TEXT NOT NULL DEFAULT 'in_progress',
  total_questions INT NOT NULL DEFAULT 0,
  correct_count INT NOT NULL DEFAULT 0,
  incorrect_count INT NOT NULL DEFAULT 0,
  unattempted_count INT NOT NULL DEFAULT 0,
  accuracy NUMERIC,
  time_taken_seconds INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  submitted_at TIMESTAMPTZ
);
CREATE INDEX quizzes_user_idx ON public.quizzes(user_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quizzes TO authenticated;
GRANT ALL ON public.quizzes TO service_role;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own quizzes" ON public.quizzes FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.quiz_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  position INT NOT NULL,
  question TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  correct_option INT NOT NULL,
  explanation TEXT NOT NULL DEFAULT '',
  shortcut TEXT,
  topic TEXT,
  difficulty INT NOT NULL DEFAULT 1,
  student_answer INT,
  is_correct BOOLEAN,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX quiz_questions_quiz_idx ON public.quiz_questions(quiz_id, position);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quiz_questions TO authenticated;
GRANT ALL ON public.quiz_questions TO service_role;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own quiz questions" ON public.quiz_questions FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- mistake book
CREATE TABLE public.mistakes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  subject_id TEXT,
  topic TEXT NOT NULL,
  question TEXT NOT NULL,
  student_answer TEXT,
  correct_answer TEXT NOT NULL,
  error_type TEXT NOT NULL DEFAULT 'concept',
  explanation TEXT,
  revised BOOLEAN NOT NULL DEFAULT false,
  revise_on DATE NOT NULL DEFAULT (now()::date + 1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX mistakes_user_idx ON public.mistakes(user_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mistakes TO authenticated;
GRANT ALL ON public.mistakes TO service_role;
ALTER TABLE public.mistakes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own mistakes" ON public.mistakes FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- study sessions
CREATE TABLE public.study_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  subject_id TEXT,
  topic TEXT,
  minutes INT NOT NULL DEFAULT 0,
  session_date DATE NOT NULL DEFAULT now()::date,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX study_sessions_user_idx ON public.study_sessions(user_id, session_date DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.study_sessions TO authenticated;
GRANT ALL ON public.study_sessions TO service_role;
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own sessions" ON public.study_sessions FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- seed library
INSERT INTO public.subjects (id, name, sort_order) VALUES
 ('quant','Quantitative Aptitude',1),
 ('reasoning','Reasoning',2),
 ('english','English',3),
 ('banking','Banking Awareness',4),
 ('ga','General Awareness & Current Affairs',5);

INSERT INTO public.topics (subject_id, name, sort_order) VALUES
 ('quant','Number System',1),('quant','Simplification & Approximation',2),('quant','HCF and LCM',3),('quant','Percentage',4),('quant','Ratio and Proportion',5),('quant','Average',6),('quant','Profit, Loss and Discount',7),('quant','Simple and Compound Interest',8),('quant','Partnership',9),('quant','Mixture and Alligation',10),('quant','Time and Work',11),('quant','Pipes and Cisterns',12),('quant','Time, Speed and Distance',13),('quant','Boats and Streams',14),('quant','Problems on Ages',15),('quant','Quadratic Equations',16),('quant','Data Interpretation',17),('quant','Data Sufficiency',18),('quant','Quantity Comparison',19),
 ('reasoning','Inequality',1),('reasoning','Syllogism',2),('reasoning','Coding-Decoding',3),('reasoning','Blood Relations',4),('reasoning','Direction Sense',5),('reasoning','Order and Ranking',6),('reasoning','Alphanumeric Series',7),('reasoning','Number and Letter Series',8),('reasoning','Seating Arrangement',9),('reasoning','Floor Puzzles',10),('reasoning','Box Puzzles',11),('reasoning','Scheduling',12),('reasoning','Input-Output',13),('reasoning','Data Sufficiency',14),('reasoning','Logical Reasoning',15),
 ('english','Parts of Speech',1),('english','Articles',2),('english','Tenses',3),('english','Subject-Verb Agreement',4),('english','Prepositions',5),('english','Conjunctions',6),('english','Pronouns',7),('english','Adjectives and Adverbs',8),('english','Modals',9),('english','Active and Passive Voice',10),('english','Direct and Indirect Speech',11),('english','Error Detection',12),('english','Reading Comprehension',13),('english','Cloze Test',14),('english','Fillers',15),('english','Para Jumbles',16),('english','Phrase Replacement',17),('english','Vocabulary',18),
 ('banking','RBI and its Functions',1),('banking','Monetary Policy',2),('banking','Repo and Reverse Repo Rate',3),('banking','CRR and SLR',4),('banking','NABARD',5),('banking','SEBI',6),('banking','SIDBI',7),('banking','IRDAI',8),('banking','Banking Terminology',9),('banking','Digital Banking and UPI',10),('banking','NEFT, RTGS and IMPS',11),('banking','Financial Inclusion',12),('banking','Government Financial Schemes',13),
 ('ga','Current Affairs - Banking & Economy',1),('ga','Government Schemes',2),('ga','Appointments and Awards',3),('ga','National and International Events',4),('ga','Sports',5),('ga','Reports and Indexes',6);
