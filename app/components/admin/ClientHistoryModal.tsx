'use client';

import { Profile, StampRecord } from '@/app/types';
import { History, X, PlusCircle, Trash2, RotateCcw, Gift, Percent, Sparkles, Tag } from 'lucide-react';

const GIFT_ICON_MAP: Record<string, React.ElementType> = {
  discount_code: Tag,
  next_visit_gift: Gift,
  vip_upgrade: Sparkles,
  referral_reward: Percent,
};

type Props = {
  profile: Profile | null;
  onClose: () => void;
  onRemoveStamp: (stamp: StampRecord) => void;
  language: string;
  getGiftLabel: (type: string, code?: string | null) => string;
};

export default function ClientHistoryModal({
  profile,
  onClose,
  onRemoveStamp,
  language,
  getGiftLabel,
}: Props) {
  if (!profile) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200 font-sans">
      <div className="w-full max-w-md max-h-[80vh] flex flex-col p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
        >
          <X size={20} />
        </button>

        <div className="flex flex-col items-center gap-1.5 mb-4 shrink-0">
          <div className="w-12 h-12 rounded-2xl bg-slate-700 text-white flex items-center justify-center shadow">
            <History size={22} />
          </div>
          <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">
            {language === 'sk' ? 'História klienta' : 'Client History'}
          </h3>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            {profile.full_name || profile.email}
          </p>
        </div>

        <div className="overflow-y-auto space-y-2 pr-1">
          {(() => {
            type TimelineItem = { key: string; date: string; node: React.ReactNode };
            const items: TimelineItem[] = [];

            profile.stamps.forEach((s) => {
              const isActive = !s.claimed && !s.removed_at;
              items.push({
                key: `stamp-created-${s.id}`,
                date: s.created_at,
                node: (
                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-sky-50 dark:bg-sky-950/20 border border-sky-100 dark:border-sky-900/40">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 bg-sky-100 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400">
                      <PlusCircle size={14} />
                    </div>
                    <div className="min-w-0 flex-1 text-left">
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                        {language === 'sk' ? 'Pečiatka pripísaná' : 'Stamp added'} — {Number(s.price).toFixed(2)} €
                      </p>
                      <p className="text-[10px] text-sky-600 dark:text-sky-400 font-medium">
                        {new Date(s.created_at).toLocaleString()}
                      </p>
                    </div>
                    {isActive && (
                      <button
                        onClick={() => onRemoveStamp(s)}
                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-950/40 transition shrink-0"
                        title={language === 'sk' ? 'Odstrániť pečiatku' : 'Remove stamp'}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ),
              });
            });

            profile.stamps
              .filter((s) => s.removed_at)
              .forEach((s) => {
                items.push({
                  key: `stamp-removed-${s.id}`,
                  date: s.removed_at as string,
                  node: (
                    <div className="flex items-center gap-3 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400">
                        <Trash2 size={14} />
                      </div>
                      <div className="min-w-0 flex-1 text-left">
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                          {language === 'sk' ? 'Pečiatka odstránená' : 'Stamp removed'} — {Number(s.price).toFixed(2)} €
                        </p>
                        <p className="text-[10px] text-rose-600 dark:text-rose-400 font-medium">
                          {new Date(s.removed_at as string).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ),
                });
              });

            const claimedGroups = new Map<string, StampRecord[]>();
            profile.stamps
              .filter((s) => s.claimed && s.claimed_at)
              .forEach((s) => {
                const key = s.claimed_at as string;
                if (!claimedGroups.has(key)) claimedGroups.set(key, []);
                claimedGroups.get(key)!.push(s);
              });

            claimedGroups.forEach((group, claimedAt) => {
              const total = group.reduce((sum, s) => sum + Number(s.price), 0);
              const avg = total / group.length;
              items.push({
                key: `claim-${claimedAt}`,
                date: claimedAt,
                node: (
                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                      <RotateCcw size={14} />
                    </div>
                    <div className="min-w-0 flex-1 text-left">
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                        {language === 'sk' ? 'Odmena uplatnená' : 'Reward claimed'} — {group.length}× ({avg.toFixed(2)} € {language === 'sk' ? 'priemer' : 'avg'})
                      </p>
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                        {new Date(claimedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ),
              });
            });

            profile.gifts.forEach((g) => {
              const GiftIconComp = GIFT_ICON_MAP[g.gift_type] || Gift;
              items.push({
                key: `gift-given-${g.id}`,
                date: g.created_at,
                node: (
                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-purple-50/50 dark:bg-purple-950/10 border border-purple-100 dark:border-purple-900/40">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 bg-purple-100 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400">
                      <GiftIconComp size={14} />
                    </div>
                    <div className="min-w-0 flex-1 text-left">
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">
                        {language === 'sk' ? 'Prekvapenie udelené' : 'Surprise given'} — {getGiftLabel(g.gift_type, g.custom_code)}
                      </p>
                      <p className="text-[10px] text-purple-600 dark:text-purple-400 font-medium">
                        {new Date(g.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ),
              });

              if (g.revoked_at) {
                items.push({
                  key: `gift-revoked-${g.id}`,
                  date: g.revoked_at,
                  node: (
                    <div className="flex items-center gap-3 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400">
                        <X size={14} />
                      </div>
                      <div className="min-w-0 flex-1 text-left">
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">
                          {language === 'sk' ? 'Prekvapenie zrušené' : 'Surprise revoked'} — {getGiftLabel(g.gift_type, g.custom_code)}
                        </p>
                        <p className="text-[10px] text-rose-600 dark:text-rose-400 font-medium">
                          {new Date(g.revoked_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ),
                });
              }
            });

            items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

            if (items.length === 0) {
              return (
                <p className="text-center text-xs text-slate-400 dark:text-slate-500 py-6">
                  {language === 'sk' ? 'Zatiaľ žiadna história.' : 'No history yet.'}
                </p>
              );
            }

            return items.map((item) => <div key={item.key}>{item.node}</div>);
          })()}
        </div>
      </div>
    </div>
  );
}