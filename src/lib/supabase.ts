import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/*
RLS policies required in Supabase dashboard:

-- requests table
CREATE POLICY "Anyone can read requests"
  ON requests FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert requests"
  ON requests FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update own requests"
  ON requests FOR UPDATE USING (auth.uid() = user_id);

-- request_votes table
CREATE POLICY "Anyone can read votes"
  ON request_votes FOR SELECT USING (true);

CREATE POLICY "Authenticated users can vote"
  ON request_votes FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can remove own vote"
  ON request_votes FOR DELETE USING (auth.uid() = user_id);

-- downloads table
CREATE POLICY "Users can read own downloads"
  ON downloads FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own downloads"
  ON downloads FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own downloads"
  ON downloads FOR DELETE USING (auth.uid() = user_id);
*/
