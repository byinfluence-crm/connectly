'use client';
import { useState } from 'react';
import { X, Star, CheckCircle, BarChart3 } from 'lucide-react';
import Button from '@/components/ui/Button';
import { submitBrandReview } from '@/lib/supabase';
import type { CollabDelivery, BrandReviewInput } from '@/lib/supabase';

function StarRating({
  value, onChange, label, sublabel,
}: { value: number; onChange: (v: number) => void; label: string; sublabel?: string }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center justify-between">
      <div>
        <div className="text-sm text-gray-800">{label}</div>
        {sublabel && <div className="text-xs text-gray-400">{sublabel}</div>}
      </div>
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
              size={20}
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

function StatBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 rounded-xl px-3 py-2.5 text-center">
      <div className="text-sm font-bold text-gray-900">{value}</div>
      <div className="text-[10px] text-gray-400 mt-0.5">{label}</div>
    </div>
  );
}

function fmt(n: number | null | undefined) {
  if (!n) return '—';
  return n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n);
}

interface Props {
  applicationId: string;
  brandId: string;
  influencerId: string;
  creatorName: string;
  collabTitle: string;
  delivery: CollabDelivery;
  onClose: () => void;
  onDone: () => void;
}

export default function BrandReviewModal({
  applicationId, brandId, influencerId, creatorName, collabTitle, delivery, onClose, onDone,
}: Props) {
  const [ratingContent, setRatingContent] = useState(0);
  const [ratingPunctuality, setRatingPunctuality] = useState(0);
  const [ratingComm, setRatingComm] = useState(0);
  const [resultsLevel, setResultsLevel] = useState<'exceeded' | 'met' | 'missed' | ''>('');
  const [wouldRepeat, setWouldRepeat] = useState<boolean | null>(null);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const canSubmit = ratingContent > 0 && ratingPunctuality > 0 && ratingComm > 0
    && resultsLevel !== '' && wouldRepeat !== null;

  const resultsRating = resultsLevel === 'exceeded' ? 5 : resultsLevel === 'met' ? 3 : 1;

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    try {
      const overallRating = Math.round((ratingContent + ratingPunctuality + ratingComm + resultsRating) / 4);
      const input: BrandReviewInput = {
        rating: overallRating,
        rating_communication: ratingComm,
        rating_professionalism: ratingPunctuality,
        rating_results: resultsRating,
        would_repeat: wouldRepeat!,
        comment: comment.trim(),
      };
      await submitBrandReview(applicationId, brandId, influencerId, input);
      onDone();
    } catch (e) {
      setError('Error al enviar. Inténtalo de nuevo.');
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col"
        style={{ maxHeight: '90vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-5 py-4 flex-shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-white font-bold">Valorar al creador</div>
              <div className="text-emerald-200 text-xs mt-0.5 truncate">{collabTitle}</div>
            </div>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/20 text-white/80 flex-shrink-0">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">

          {/* Estadísticas de la entrega (read-only) */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 size={14} className="text-emerald-600" />
              <span className="text-sm font-bold text-gray-900">Resultados de {creatorName}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <StatBadge label="Alcance" value={fmt(delivery.reach)} />
              <StatBadge label="Impresiones" value={fmt(delivery.impressions)} />
              <StatBadge label="Interacciones" value={fmt(delivery.interactions)} />
              {delivery.video_views && <StatBadge label="Visualizaciones" value={fmt(delivery.video_views)} />}
              {delivery.stories_count && <StatBadge label="Stories" value={String(delivery.stories_count)} />}
              {delivery.link_clicks && <StatBadge label="Clics enlace" value={fmt(delivery.link_clicks)} />}
            </div>
            {delivery.post_urls.length > 0 && (
              <div className="mt-3 space-y-1">
                {delivery.post_urls.map((url, i) => (
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs text-violet-600 hover:text-violet-700 truncate"
                  >
                    <span className="bg-violet-50 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide">
                      {delivery.content_types[i] || 'post'}
                    </span>
                    {url}
                  </a>
                ))}
              </div>
            )}
            {delivery.story_screenshot_urls?.length > 0 && (
              <div className="mt-3">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Capturas de stories</p>
                <div className="grid grid-cols-3 gap-2">
                  {delivery.story_screenshot_urls.map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                      <img
                        src={url}
                        alt={`Story ${i + 1}`}
                        className="w-full aspect-square object-cover rounded-xl border border-gray-100 hover:opacity-80 transition-opacity"
                      />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="h-px bg-gray-100" />

          {/* Valoración */}
          <div>
            <p className="text-sm font-semibold text-gray-900 mb-4">Ahora valora al creador</p>
            <div className="space-y-4">
              <StarRating value={ratingContent} onChange={setRatingContent} label="Calidad del contenido" sublabel="¿Cumplió con lo pedido en el briefing?" />
              <StarRating value={ratingPunctuality} onChange={setRatingPunctuality} label="Puntualidad" sublabel="¿Publicó en el plazo acordado?" />
              <StarRating value={ratingComm} onChange={setRatingComm} label="Comunicación" sublabel="¿Fue profesional y accesible?" />
            </div>
          </div>

          {/* Resultados */}
          <div>
            <p className="text-sm text-gray-800 mb-2">¿Los resultados cumplieron tus expectativas?</p>
            <div className="flex gap-2">
              {[
                { value: 'exceeded', label: '🚀 Superó', color: 'emerald' },
                { value: 'met',      label: '✅ Cumplió', color: 'blue' },
                { value: 'missed',   label: '❌ No cumplió', color: 'red' },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setResultsLevel(opt.value as typeof resultsLevel)}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold border-2 transition-all ${
                    resultsLevel === opt.value
                      ? `border-${opt.color}-500 bg-${opt.color}-50 text-${opt.color}-700`
                      : 'border-gray-200 text-gray-400 hover:border-gray-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Repetiría */}
          <div>
            <p className="text-sm text-gray-800 mb-2">¿Repetirías con {creatorName}?</p>
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

          {/* Comentario */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">Comentario (opcional)</label>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              rows={3}
              maxLength={400}
              placeholder="¿Qué destacarías de este creador?"
              className="w-full px-3.5 py-3 rounded-2xl border border-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <p className="text-xs text-gray-300 text-right mt-1">{comment.length}/400</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-3.5 py-3 text-sm text-red-600">{error}</div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100 flex-shrink-0">
          <Button
            fullWidth size="md"
            disabled={!canSubmit || submitting}
            loading={submitting}
            onClick={handleSubmit}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <CheckCircle size={16} /> Publicar valoración y ver resultados
          </Button>
          <p className="text-center text-xs text-gray-400 mt-2">
            Ambas reseñas se publicarán en los perfiles al mismo tiempo
          </p>
        </div>
      </div>
    </div>
  );
}
