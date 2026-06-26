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

-- community_videos table
CREATE TABLE community_videos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  embed_url TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT 'other',
  submitted_by UUID NOT NULL REFERENCES auth.users(id),
  tmdb_id INTEGER,
  year INTEGER,
  language TEXT DEFAULT 'en',
  poster_url TEXT,
  vote_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- community_votes table
CREATE TABLE community_votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id UUID NOT NULL REFERENCES community_videos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  vote SMALLINT NOT NULL CHECK (vote IN (1, -1)),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (video_id, user_id)
);

CREATE POLICY "Anyone can read community videos"
  ON community_videos FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert community videos"
  ON community_videos FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update own community videos"
  ON community_videos FOR UPDATE USING (auth.uid() = submitted_by);

CREATE POLICY "Anyone can read community votes"
  ON community_votes FOR SELECT USING (true);

CREATE POLICY "Authenticated users can vote"
  ON community_votes FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can remove own vote"
  ON community_votes FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can update own vote"
  ON community_votes FOR UPDATE USING (auth.uid() = user_id);

-- downloads table
CREATE POLICY "Users can read own downloads"
  ON downloads FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own downloads"
  ON downloads FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own downloads"
  ON downloads FOR DELETE USING (auth.uid() = user_id);
*/
