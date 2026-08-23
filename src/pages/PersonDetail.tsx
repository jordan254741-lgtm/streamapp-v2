import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getPersonDetails, getPersonMovieCredits } from '@/lib/tmdb';
import { usePageMeta } from '@/hooks/usePageMeta';
import MovieCard from '@/components/movies/MovieCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeftIcon, CakeIcon, MapPinIcon, ClapperboardIcon, StarIcon } from 'lucide-react';
import type { Movie, PersonMovieCredit } from '@/types';

const formatDate = (value: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
};

const PersonDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const personId = id ? parseInt(id, 10) : 0;

  usePageMeta({
    title: 'Person',
    description: 'Filmography and biography.',
  });

  const personQuery = useQuery({
    queryKey: ['person', personId],
    queryFn: () => getPersonDetails(personId),
    enabled: personId > 0,
    staleTime: 1000 * 60 * 60,
  });

  const creditsQuery = useQuery({
    queryKey: ['personCredits', personId],
    queryFn: () => getPersonMovieCredits(personId),
    enabled: personId > 0,
    staleTime: 1000 * 60 * 60,
  });

  const { filmography, knownFor } = useMemo(() => {
    const credits = creditsQuery.data;
    if (!credits) {
      return { filmography: [] as (PersonMovieCredit & { role: string })[], knownFor: [] as (PersonMovieCredit & { role: string })[] };
    }

    const merged = new Map<number, PersonMovieCredit & { role: string }>();

    for (const entry of credits.cast ?? []) {
      if (!merged.has(entry.id)) {
        merged.set(entry.id, { ...entry, title: entry.title || 'Untitled', role: entry.character ? `as ${entry.character}` : 'Actor' });
      }
    }
    for (const entry of credits.crew ?? []) {
      const existing = merged.get(entry.id);
      if (existing) {
        if (existing.role === 'Actor' && entry.job) existing.role = entry.job;
      } else {
        merged.set(entry.id, { ...entry, title: entry.title || 'Untitled', role: entry.job || 'Crew' });
      }
    }

    const all = [...merged.values()];
    const sorted = all.sort((a, b) => b.popularity - a.popularity);
    return {
      filmography: [...sorted].sort((a, b) => (b.release_date || '').localeCompare(a.release_date || '')),
      knownFor: sorted.filter((c) => c.poster_path && c.vote_count > 20).slice(0, 12),
    };
  }, [creditsQuery.data]);

  const person = personQuery.data;

  if (personQuery.isLoading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
          <Skeleton className="h-10 w-40 mb-8 rounded-xl" />
          <div className="flex flex-col md:flex-row gap-8">
            <Skeleton className="w-full md:w-72 aspect-[2/3] rounded-2xl shrink-0" />
            <div className="flex-1 space-y-4">
              <Skeleton className="h-10 w-64 rounded-xl" />
              <Skeleton className="h-4 w-48 rounded-md" />
              <Skeleton className="h-24 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!person) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-neutral-400 mb-4">Person not found.</p>
          <Button onClick={() => navigate(-1)} variant="outline">Go Back</Button>
        </div>
      </div>
    );
  }

  const birthday = formatDate(person.birthday);
  const deathday = formatDate(person.deathday);
  const age = person.birthday
    ? Math.floor(
        ((person.deathday ? new Date(person.deathday).getTime() : Date.now()) -
          new Date(person.birthday).getTime()) /
          (1000 * 60 * 60 * 24 * 365.25),
      )
    : null;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero */}
      <div className="relative border-b border-white/[0.06] bg-gradient-to-b from-white/[0.04] to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
          <Button
            onClick={() => navigate(-1)}
            variant="ghost"
            size="sm"
            className="gap-1.5 text-neutral-400 hover:text-white mb-6 -ml-2"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Back
          </Button>

          <div className="flex flex-col md:flex-row gap-6 md:gap-10">
            <div className="w-40 md:w-72 shrink-0">
              <div className="aspect-[2/3] rounded-2xl overflow-hidden bg-white/[0.03] border border-white/[0.08] shadow-[0_8px_40px_rgba(0,0,0,0.5)]">
                {person.profile_path ? (
                  <img
                    src={`https://image.tmdb.org/t/p/w500${person.profile_path}`}
                    alt={person.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ClapperboardIcon className="h-10 w-10 text-neutral-600" />
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <h1 className="text-3xl md:text-5xl font-bold tracking-tight leading-tight">{person.name}</h1>
              {person.known_for_department && (
                <Badge variant="secondary" className="mt-3">
                  {person.known_for_department}
                </Badge>
              )}

              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-4 text-sm text-neutral-400">
                {birthday && (
                  <span className="inline-flex items-center gap-1.5">
                    <CakeIcon className="h-4 w-4 text-neutral-500" />
                    {deathday ? `${birthday} — ${deathday}` : birthday}
                    {age !== null && !deathday && ` (${age})`}
                  </span>
                )}
                {person.place_of_birth && (
                  <span className="inline-flex items-center gap-1.5 min-w-0">
                    <MapPinIcon className="h-4 w-4 text-neutral-500 shrink-0" />
                    <span className="truncate">{person.place_of_birth}</span>
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5">
                  <StarIcon className="h-4 w-4 text-amber-400" />
                  {filmography.length} credits
                </span>
              </div>

              {person.biography ? (
                <p className="mt-5 text-neutral-300 leading-relaxed max-w-3xl line-clamp-6 md:line-clamp-none">
                  {person.biography}
                </p>
              ) : (
                <p className="mt-5 text-neutral-500 italic max-w-3xl">No biography available.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Known For */}
      {knownFor.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 md:pt-14">
          <h2 className="text-xl font-bold tracking-tight mb-5">Known For</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
            {knownFor.map((credit) => (
              <MovieCard
                key={`known-${credit.id}`}
                movie={credit as unknown as Movie}
                onClick={() => navigate(`/movie/${credit.id}`)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Full Filmography */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
        <h2 className="text-xl font-bold tracking-tight mb-5">
          Filmography
          <span className="text-neutral-500 font-normal text-base ml-2">({filmography.length})</span>
        </h2>

        {creditsQuery.isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : filmography.length === 0 ? (
          <p className="text-neutral-500">No filmography available.</p>
        ) : (
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] divide-y divide-white/[0.05] overflow-hidden">
            {filmography.map((credit) => (
              <button
                key={`film-${credit.id}-${credit.role}`}
                onClick={() => navigate(`/movie/${credit.id}`)}
                className="w-full flex items-center gap-4 px-4 md:px-5 py-3.5 text-left hover:bg-white/[0.04] transition-colors duration-150 group"
              >
                <span className="w-14 shrink-0 text-sm text-neutral-500 tabular-nums">
                  {credit.release_date ? credit.release_date.split('-')[0] : '—'}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-medium text-white/90 truncate group-hover:text-white">
                    {credit.title}
                  </span>
                  <span className="block text-xs text-neutral-500 truncate">{credit.role}</span>
                </span>
                {credit.vote_average > 0 && (
                  <span className="hidden sm:inline-flex items-center gap-1 text-xs text-neutral-400 shrink-0">
                    <StarIcon className="h-3 w-3 text-amber-400" />
                    {credit.vote_average.toFixed(1)}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default PersonDetail;
