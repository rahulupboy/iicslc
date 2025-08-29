-- Add user_id foreign key to day_problems table
ALTER TABLE public.day_problems 
ADD COLUMN user_id UUID REFERENCES public.profiles(user_id);

-- Update existing day_problems to assign them to existing users (for testing)
DO $$
DECLARE
    user_record RECORD;
    problem_record RECORD;
    counter INTEGER := 0;
BEGIN
    -- Assign problems to users in round-robin fashion
    FOR user_record IN SELECT user_id FROM public.profiles LOOP
        FOR problem_record IN SELECT id FROM public.day_problems WHERE user_id IS NULL ORDER BY day_number LOOP
            UPDATE public.day_problems 
            SET user_id = user_record.user_id 
            WHERE id = problem_record.id AND user_id IS NULL;
            
            counter := counter + 1;
            -- Limit to avoid assigning too many problems per user
            IF counter >= 2 THEN
                counter := 0;
                EXIT;
            END IF;
        END LOOP;
    END LOOP;
END $$;

-- Create RLS policies for user-specific day_problems
DROP POLICY IF EXISTS "Everyone can view day problems" ON public.day_problems;

CREATE POLICY "Users can view their own day problems" 
ON public.day_problems 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own day problems" 
ON public.day_problems 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);