const REQUIRED_VARS = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'VITE_TMDB_API_KEY',
] as const;

type RequiredVar = (typeof REQUIRED_VARS)[number];

let validated = false;

export function validateEnv(): void {
  if (validated) return;

  const missing: string[] = [];

  for (const varName of REQUIRED_VARS) {
    const value = import.meta.env[varName];
    if (!value || value.trim() === '') {
      missing.push(varName);
    }
  }

  if (missing.length > 0) {
    const message = `Missing required environment variables:\n${missing.map((v) => `  - ${v}`).join('\n')}\n\nPlease create a .env file with these variables.`;
    console.error(message);
    if (typeof window !== 'undefined') {
      alert(message);
    }
    throw new Error(message);
  }

  validated = true;
}

export function getEnv<T extends RequiredVar>(key: T): string {
  const value = import.meta.env[key];
  if (!value || value.trim() === '') {
    throw new Error(`Environment variable ${key} is not set`);
  }
  return value;
}

export function getOptionalEnv(key: string): string | undefined {
  const value = import.meta.env[key];
  return value && value.trim() !== '' ? value : undefined;
}
