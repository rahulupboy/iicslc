-- Insert sample day problems for testing
INSERT INTO public.day_problems (day_number, problem_title, problem_description, challenge_date, is_active) VALUES
(1, 'Array Manipulation Challenge', 'Write a function to find the maximum subarray sum using Kadane''s algorithm. Include edge cases and optimize for O(n) time complexity.', '2024-09-30', true),
(2, 'Data Structure Design', 'Design and implement a LRU (Least Recently Used) cache with O(1) get and put operations. Use appropriate data structures.', '2024-10-01', true),
(3, 'Dynamic Programming Problem', 'Solve the coin change problem: Given coins of different denominations, find the minimum number of coins needed to make a given amount.', '2024-10-02', true),
(4, 'Tree Traversal Challenge', 'Implement all three tree traversal methods (inorder, preorder, postorder) both recursively and iteratively for a binary tree.', '2024-10-03', false),
(5, 'Graph Algorithm Problem', 'Implement Dijkstra''s shortest path algorithm and find the shortest path between two nodes in a weighted graph.', '2024-10-04', false);

-- Insert some sample scores for leaderboard testing (only if there are existing profiles)
DO $$
DECLARE
    user_count INTEGER;
BEGIN
    -- Check if there are any profiles
    SELECT COUNT(*) INTO user_count FROM public.profiles;
    
    IF user_count > 0 THEN
        -- Insert sample scores for existing users
        INSERT INTO public.scores (user_id, day_problem_id, code_score, video_score, total_score)
        SELECT 
            p.user_id,
            dp.id,
            FLOOR(RANDOM() * 40 + 10)::INTEGER, -- Random code score between 10-50
            FLOOR(RANDOM() * 40 + 10)::INTEGER, -- Random video score between 10-50
            NULL -- Will be calculated by trigger if we add one, or manually
        FROM public.profiles p
        CROSS JOIN (SELECT id FROM public.day_problems WHERE day_number <= 3) dp
        LIMIT 15; -- Limit to avoid too many rows

        -- Update total_score column
        UPDATE public.scores 
        SET total_score = COALESCE(code_score, 0) + COALESCE(video_score, 0)
        WHERE total_score IS NULL;
    END IF;
END $$;