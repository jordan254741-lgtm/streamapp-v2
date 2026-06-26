
-- Create profiles table
CREATE TABLE profiles (
    id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
    full_name text,
    avatar_url text,
    is_admin boolean DEFAULT FALSE
);

-- RLS for profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));

-- Create movies table
CREATE TABLE movies (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    tmdb_id integer UNIQUE NOT NULL,
    title text NOT NULL,
    youtube_id text,
    is_verified boolean DEFAULT FALSE
);

-- RLS for movies
ALTER TABLE movies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view published movies" ON movies
  FOR SELECT USING (is_verified = TRUE);

CREATE POLICY "Admins can manage all movies" ON movies
  FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));

-- Create watchlist table
CREATE TABLE watchlist (
    user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    tmdb_id integer NOT NULL,
    PRIMARY KEY (user_id, tmdb_id)
);

-- RLS for watchlist
ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own watchlist" ON watchlist
  FOR ALL USING (auth.uid() = user_id);

-- Create watch_history table
CREATE TABLE watch_history (
    user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    tmdb_id integer NOT NULL,
    progress_seconds integer,
    PRIMARY KEY (user_id, tmdb_id)
);

-- RLS for watch_history
ALTER TABLE watch_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own watch history" ON watch_history
  FOR ALL USING (auth.uid() = user_id);

-- Create downloads table
CREATE TABLE downloads (
    user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    tmdb_id integer NOT NULL,
    quality text,
    status text,
    PRIMARY KEY (user_id, tmdb_id)
);

-- RLS for downloads
ALTER TABLE downloads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own downloads" ON downloads
  FOR ALL USING (auth.uid() = user_id);

-- Create requests table
CREATE TABLE requests (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    title text NOT NULL,
    year integer,
    status text DEFAULT 'pending',
    vote_count integer DEFAULT 0
);

-- RLS for requests
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create requests" ON requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view all requests" ON requests
  FOR SELECT USING (TRUE);

CREATE POLICY "Admins can manage all requests" ON requests
  FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));

-- Create request_votes table
CREATE TABLE request_votes (
    user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    request_id uuid REFERENCES requests ON DELETE CASCADE NOT NULL,
    PRIMARY KEY (user_id, request_id)
);

-- RLS for request_votes
ALTER TABLE request_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own request votes" ON request_votes
  FOR ALL USING (auth.uid() = user_id);

-- Create subscriptions table
CREATE TABLE subscriptions (
    user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
    plan text NOT NULL,
    status text NOT NULL,
    mpesa_receipt text
);

-- RLS for subscriptions
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own subscriptions" ON subscriptions
  FOR ALL USING (auth.uid() = user_id);

-- Create payments table
CREATE TABLE payments (
    user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    amount numeric NOT NULL,
    mpesa_receipt text NOT NULL UNIQUE,
    status text NOT NULL,
    created_at timestamp WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (user_id, mpesa_receipt)
);

-- RLS for payments
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own payments" ON payments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all payments" ON payments
  FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));

-- Enable 'uuid-ossp' extension for uuid_generate_v4()
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Function to create a new profile when a new user signs up
CREATE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call handle_new_user on auth.users inserts
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

