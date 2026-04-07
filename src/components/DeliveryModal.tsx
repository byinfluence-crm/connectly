'use client';
import { useState } from 'react';
import { X, Plus, Trash2, ChevronRight, ChevronLeft, CheckCircle, Star, Link2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import { submitDelivery, submitInfluencerReview } from '@/lib/supabase';
import type { DeliveryInput, InfluencerReviewInput } from '@/lib/supabase';

// ─── Tipos internos ───────────────────────────────────────────────────────────

type ContentType = 'post' | 'reel' | 'story' | 'tiktok' | 'youtube_short';

interface PostEntry {
  url: string;
  type: ContentType;
}

const CONTENT_TYPES: { value: ContentType; label: string }[] = [
  { value: 'post', label: 'Post' },
  { value: 'reel', label: 'Reel' },
  { value: 'story', label: 'Story' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'youtube_short', label: 'YouTube Short' },
];

// ─── StarRating sub-component ─────────────────────────────────────────────────

function StarRating({
  value, onChange, label,
}: { value: number; onChange: (v: number) => void; label: string }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-700">{label}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(s => (
          <button
            key={s}
            type="button"
            onClick={() => onChange(s)}
            onMouseEnter={() => setHover(s)}
            onMouseLeave={() => setHover(0)}
            className="transition-transform hover:scale-110"
          >
            <Star
              size={22}
              className={`transition-colors ${
                s <= (hover || value) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Modal principal ──────────────────────────────────────────────────────────

interface Props {
  applicationId: string;
  influencerId: string;
  brandId: string;
  brandName: string;
  collabTitle: string;
  onClose: () => void;
  onDone: () => void;
}

export default function DeliveryModal({
  applicationId, influencerId, brandId, brandName, collabTitle, onClose, onDone,
}: Props) {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Step 1: publicaciones
  const [posts, setPosts] = useState<PostEntry[]>([{ url: '', type: 'reel' }]);

  // Step 2: estadísticas permanentes
  const [reach, setReach] = useState('');
  const [impressions, setImpressions] = useState('');
  const [interactions, setInteractions] = useState('');
  const [videoViews, setVideoViews] = useState('');

  // Step 3: stories
  const [hasStories, setHasStories] = useState(false);
  const [storiesCount, setStoriesCount] = useState('');
  const [storyViewsAvg, setStoryViewsAvg] = useState('');
  const [linkClicks, setLinkClicks] = useState('');
  const [storyReplies, setStoryReplies] = useState('');
  const [stickerTaps, setStickerTaps] = useState('');

  // Step 4: valoración marca
  const [ratingComm, setRatingComm] = useState(0);
  const [ratingProf, setRatingProf] = useState(0);
  const [ratingProduct, setRatingProduct] = useState(0);
  const [wouldRepeat, setWouldRepeat] = useState<boolean | null>(null);
  const [comment, setComment] = useState('');

  const n = (s: string) => s ? parseInt(s, 10) : undefined;

  const addPost = () => setPosts(p => [...p, { url: '', type: 'reel' }]);
  const removePost = (i: number) => setPosts(p => p.filter((_, idx) => idx !== i));
  const updatePost = (i: number, field: keyof PostEntry, val: string) =>
    setPosts(p => p.map((e, idx) => idx === i ? { ...e, [field]: val } : e));

  const canNext = () => {
    if (step === 1) return posts.some(p => p.url.trim());
    if (step === 2) return !!reach;
    if (step === 3) return true;
    if (step === 4) return ratingComm > 0 && ratingProf > 0 && ratingProduct > 0 && wouldRepeat !== null;
    return false;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    try {
      const validPosts = posts.filter(p => p.url.trim());
      const deliveryData: DeliveryInput = {
        post_urls: validPosts.map(p => p.url.trim()),
        content_types: validPosts.map(p => p.type),
        reach: n(reach),
        impressions: n(impressions),
        interactions: n(interactions),
        video_views: n(videoViews),
        ...(hasStories ? {
          stories_count: n(storiesCount),
          story_views_avg: n(storyViewsAvg),
          link_clicks: n(linkClicks),
          story_replies: n(storyReplies),
          sticker_taps: n(stickerTaps),
        } : {}),
      };

      const overallRating = Math.round((ratingComm + ratingProf + ratingProduct) / 3);
      const reviewData: InfluencerReviewInput = {
        rating: overallRating,
        rating_communication: ratingComm,
        rating_professionalism: ratingProf,
        rating_results: ratingProduct,
        would_repeat: wouldRepeat!,
        comment: comment.trim(),
      };

      await submitDelivery(applicationId, influencerId, deliveryData);
      await submitInfluencerReview(applicationId, influencerId, brandId, reviewData);
      onDone();
    } catch (e) {
      setError('Error al enviar. Inténtalo de nuevo.');
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const STEPS = ['Publicaciones', 'Estadísticas', 'Stories', 'Valoración'];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col"
        style={{ maxHeight: '90vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-violet-600 to-violet-700 px-5 py-4 flex-shrink-0">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <div className="text-white font-bold">Entregar resultados</div>
              <div className="text-violet-200 text-xs truncate mt-0.5">{collabTitle}</div>
            </div>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/20 text-white/80 flex-shrink-0">
              <X size={18} />
            </button>
          </div>
          {/* Step indicators */}
          <div className="flex gap-1.5">
            {STEPS.map((s, i) => (
              <div key={s} className="flex-1">
                <div className={`h-1.5 rounded-full transition-all ${i + 1 <= step ? 'bg-white' : 'bg-white/30'}`} />
                <div className={`text-[9px] mt-1 font-medium text-center truncate ${i + 1 <= step ? 'text-white' : 'text-white/50'}`}>
                  {s}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-5">

          {/* ── Step 1: Publicaciones ── */}
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">Añade los enlaces de todo el contenido publicado para esta colaboración.</p>
              {posts.map((post, i) => (
                <div key={i} className="border border-gray-100 rounded-2xl p-3.5 space-y-2.5">
                  <div className="flex items-center gap-2">
                    <Link2 size={14} className="text-violet-500 flex-shrink-0" />
                    <input
                      type="url"
                      value={post.url}
                      onChange={e => updatePost(i, 'url', e.target.value)}
                      placeholder="https://www.instagram.com/p/..."
                      className="flex-1 text-sm border-0 outline-none text-gray-900 placeholder-gray-300"
                    />
                    {posts.length > 1 && (
                      <button onClick={() => removePost(i)} className="text-red-400 hover:text-red-600 flex-shrink-0">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {CONTENT_TYPES.map(ct => (
                      <button
                        key={ct.value}
                        onClick={() => updatePost(i, 'type', ct.value)}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                          post.type === ct.value
                            ? 'bg-violet-600 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {ct.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              <button
                onClick={addPost}
                className="flex items-center gap-2 text-sm text-violet-600 font-medium hover:text-violet-700 transition-colors"
              >
                <Plus size={15} /> Añadir otra publicación
              </button>
            </div>
          )}

          {/* ── Step 2: Estadísticas permanentes ── */}
          {step === 2 && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">Estadísticas de contenido permanente (post, reel, TikTok…).</p>
              <div className="grid grid-cols-2 gap-3">
                <StatInput label="Alcance *" value={reach} onChange={setReach} placeholder="ej. 12400" required />
                <StatInput label="Impresiones" value={impressions} onChange={setImpressions} placeholder="ej. 18200" />
                <StatInput label="Interacciones" value={interactions} onChange={setInteractions} placeholder="ej. 920" />
                <StatInput label="Visualizaciones" value={videoViews} onChange={setVideoViews} placeholder="Solo vídeo" />
              </div>
              <p className="text-xs text-gray-400">* El alcance es el único campo obligatorio.</p>
            </div>
          )}

          {/* ── Step 3: Stories ── */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-gray-900">¿Publicaste stories?</div>
                  <div className="text-xs text-gray-400">Añade las estadísticas si las tienes</div>
                </div>
                <button
                  onClick={() => setHasStories(!hasStories)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${hasStories ? 'bg-violet-600' : 'bg-gray-200'}`}
                >
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${hasStories ? 'translate-x-7' : 'translate-x-1'}`} />
                </button>
              </div>
              {hasStories && (
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <StatInput label="Nº de stories" value={storiesCount} onChange={setStoriesCount} placeholder="ej. 5" />
                  <StatInput label="Vistas media" value={storyViewsAvg} onChange={setStoryViewsAvg} placeholder="ej. 3200" />
                  <StatInput label="Clics en enlace" value={linkClicks} onChange={setLinkClicks} placeholder="ej. 87" />
                  <StatInput label="Respuestas" value={storyReplies} onChange={setStoryReplies} placeholder="ej. 14" />
                  <StatInput label="Sticker taps" value={stickerTaps} onChange={setStickerTaps} placeholder="ej. 42" />
                </div>
              )}
              {!hasStories && (
                <div className="bg-gray-50 rounded-2xl p-5 text-center">
                  <div className="text-2xl mb-2">📹</div>
                  <p className="text-sm text-gray-400">Sin stories — puedes continuar al siguiente paso.</p>
                </div>
              )}
            </div>
          )}

          {/* ── Step 4: Valoración de la marca ── */}
          {step === 4 && (
            <div className="space-y-5">
              <div>
                <p className="text-sm font-semibold text-gray-900 mb-0.5">Valora tu experiencia con {brandName}</p>
                <p className="text-xs text-gray-400">Tu reseña es privada hasta que la marca también valore la colaboración.</p>
              </div>
              <div className="space-y-4">
                <StarRating value={ratingComm} onChange={setRatingComm} label="Comunicación del briefing" />
                <StarRating value={ratingProf} onChange={setRatingProf} label="Trato y profesionalidad" />
                <StarRating value={ratingProduct} onChange={setRatingProduct} label="Producto / servicio" />
              </div>

              <div>
                <p className="text-sm text-gray-700 mb-2">¿Repetirías con esta marca?</p>
                <div className="flex gap-2">
                  {([true, false] as const).map(v => (
                    <button
                      key={String(v)}
                      onClick={() => setWouldRepeat(v)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                        wouldRepeat === v
                          ? v ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-red-400 bg-red-50 text-red-600'
                          : 'border-gray-200 text-gray-400 hover:border-gray-300'
                      }`}
                    >
                      {v ? '👍 Sí' : '👎 No'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-700 font-medium block mb-1.5">Comentario (opcional)</label>
                <textarea
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  rows={3}
                  maxLength={400}
                  placeholder="¿Qué destacarías de esta colaboración?"
                  className="w-full px-3.5 py-3 rounded-2xl border border-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
                <p className="text-xs text-gray-300 text-right mt-1">{comment.length}/400</p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-3.5 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100 flex gap-2 flex-shrink-0 bg-white">
          {step > 1 && (
            <Button variant="outline" size="md" onClick={() => setStep(s => s - 1)} className="flex-shrink-0">
              <ChevronLeft size={16} />
            </Button>
          )}
          {step < 4 ? (
            <Button fullWidth size="md" disabled={!canNext()} onClick={() => setStep(s => s + 1)}>
              Siguiente <ChevronRight size={16} />
            </Button>
          ) : (
            <Button
              fullWidth size="md"
              disabled={!canNext() || submitting}
              loading={submitting}
              onClick={handleSubmit}
            >
              <CheckCircle size={16} /> Enviar entrega y reseña
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function StatInput({
  label, value, onChange, placeholder, required,
}: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; required?: boolean }) {
  return (
    <div>
      <label className="text-xs font-medium text-gray-500 block mb-1">{label}</label>
      <input
        type="number"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 ${
          required && !value ? 'border-amber-300' : 'border-gray-200'
        }`}
      />
    </div>
  );
}
