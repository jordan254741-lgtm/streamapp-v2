import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { usePageMeta } from '@/hooks/usePageMeta';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const Login: React.FC = () => {
  usePageMeta({
    title: 'Sign In',
    description: 'Sign in to your StreamApp account.',
  });
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    } else {
      navigate('/browse');
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-black p-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.03),transparent_50%)]" />
      <div className="relative w-full max-w-[400px]">
        <div className="text-center mb-10">
          <Link to="/browse" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center">
              <svg className="w-5 h-5 text-black" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </div>
          </Link>
          <h1 className="text-2xl font-bold text-white tracking-tight">Welcome back</h1>
          <p className="text-neutral-500 text-sm mt-1">Sign in to continue watching</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <Label htmlFor="email" className="text-neutral-400 mb-1.5 block">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 rounded-xl bg-white/[0.04] border-white/[0.08]"
            />
          </div>
          <div>
            <Label htmlFor="password" className="text-neutral-400 mb-1.5 block">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 rounded-xl bg-white/[0.04] border-white/[0.08]"
            />
          </div>
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}
          <Button type="submit" className="w-full h-12 rounded-xl text-base font-semibold" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
          <p className="text-center text-sm text-neutral-500">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="text-white hover:underline font-medium">Sign up</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;
