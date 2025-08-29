-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  gender TEXT,
  skills TEXT[] DEFAULT '{}',
  problem_statement TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create day_problems table for daily challenges
CREATE TABLE public.day_problems (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  day_number INTEGER NOT NULL,
  problem_title TEXT NOT NULL,
  problem_description TEXT NOT NULL,
  is_active BOOLEAN DEFAULT false,
  challenge_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create submissions table for daily submissions
CREATE TABLE public.submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day_problem_id UUID NOT NULL REFERENCES public.day_problems(id) ON DELETE CASCADE,
  file_url TEXT,
  video_url TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, day_problem_id)
);

-- Create scores table for tracking scores
CREATE TABLE public.scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day_problem_id UUID NOT NULL REFERENCES public.day_problems(id) ON DELETE CASCADE,
  code_score INTEGER DEFAULT 0,
  video_score INTEGER DEFAULT 0,
  total_score INTEGER GENERATED ALWAYS AS (code_score + video_score) STORED,
  evaluated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, day_problem_id)
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.day_problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scores ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create policies for day_problems
CREATE POLICY "Everyone can view day problems" ON public.day_problems FOR SELECT USING (true);

-- Create policies for submissions
CREATE POLICY "Users can view all submissions" ON public.submissions FOR SELECT USING (true);
CREATE POLICY "Users can create their own submissions" ON public.submissions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own submissions" ON public.submissions FOR UPDATE USING (auth.uid() = user_id);

-- Create policies for scores
CREATE POLICY "Users can view all scores" ON public.scores FOR SELECT USING (true);

-- Create function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', NEW.email));
  RETURN NEW;
END;
$$;

-- Create trigger for new user profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for profiles updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial day problems (first 3 days for skill refinement)
INSERT INTO public.day_problems (day_number, problem_title, problem_description, challenge_date, is_active) VALUES
(1, 'JavaScript Fundamentals Challenge', 'Create a modern JavaScript application demonstrating ES6+ features, async/await, and DOM manipulation. Build a todo app with local storage integration.', '2024-09-30', true),
(2, 'React Component Architecture', 'Design and implement a reusable component library with proper TypeScript types, custom hooks, and responsive design patterns.', '2024-10-01', false),
(3, 'Data Structures & Algorithms', 'Solve advanced DSA problems focusing on time complexity optimization. Implement a sorting algorithm visualizer with animations.', '2024-10-02', false);

-- Enable real-time for leaderboard
ALTER TABLE public.scores REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.scores;