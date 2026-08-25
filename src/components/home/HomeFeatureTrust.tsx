import React from 'react';
import {
  ArrowRight,
  Check,
  ChevronRight,
  CreditCard,
  FlaskConical,
  MessageCircle,
  ShoppingBag,
  Star,
  TrendingUp,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { AppLink } from '../ui/AppLink';
import { ROUTES } from '../../lib/routing';

const FEATURE_CARDS: Array<{
  href: string;
  title: string;
  copy: string;
  icon: LucideIcon;
  iconWrap: string;
  iconColor: string;
}> = [
  {
    href: '/quality',
    title: 'Sourcing the Purest Peptides',
    copy: 'Every compound is rigorously tested and certified to the highest purity standards before dispatch.',
    icon: FlaskConical,
    iconWrap: 'bg-amber-50',
    iconColor: 'text-amber-500',
  },
  {
    href: '/contact',
    title: 'Unmatched Customer Service',
    copy: 'Dedicated UK-based support team — real people, fast responses, expert guidance.',
    icon: Users,
    iconWrap: 'bg-sky-50',
    iconColor: 'text-sky-500',
  },
  {
    href: ROUTES.account,
    title: 'VIP List Eligibility',
    copy: 'Join our exclusive researcher programme for early access, priority stock and member-only pricing.',
    icon: Star,
    iconWrap: 'bg-violet-50',
    iconColor: 'text-violet-500',
  },
];

const CHECKLIST = [
  'Dedicated UK-based customer support team — real experts',
  'VIP list eligibility — early access to new compounds & member pricing',
  'Strictly for research use — full regulatory compliance documentation',
] as const;

const MINI_STATS = [
  { value: '4.9★', label: 'Avg. Rating' },
  { value: '100%', label: 'Reorder Rate' },
  { value: 'UK', label: 'Based & Owned' },
] as const;

const TRUST_STRIP: Array<{ icon: LucideIcon; title: string; subtitle: string }> = [
  { icon: Star, title: 'VIP List Access', subtitle: 'Exclusive member pricing' },
  { icon: Users, title: 'Dedicated Support', subtitle: 'UK-based expert team' },
  { icon: CreditCard, title: 'Secure Payments', subtitle: 'SSL encrypted checkout' },
  { icon: TrendingUp, title: 'Growing Catalogue', subtitle: 'New compounds monthly' },
  { icon: MessageCircle, title: 'Research Community', subtitle: '2,400+ active researchers' },
];

export const HomeFeatureTrust: React.FC = () => {
  return (
    <div className="mt-14 sm:mt-16">
      <div className="grid items-start gap-8 lg:grid-cols-12 lg:gap-10">
        <div className="space-y-3 lg:col-span-5">
          {FEATURE_CARDS.map((card) => (
            <AppLink
              key={card.title}
              href={card.href}
              className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-md shadow-slate-900/10 transition-shadow hover:shadow-lg"
            >
              <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${card.iconWrap} ${card.iconColor}`}>
                <card.icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold text-[#0B132B]">{card.title}</span>
                <span className="mt-0.5 block text-xs leading-relaxed text-slate-500">{card.copy}</span>
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" aria-hidden="true" />
            </AppLink>
          ))}
        </div>

        <div className="lg:col-span-7">
          <ul className="space-y-3">
            {CHECKLIST.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm text-slate-600">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#3B5BFF] text-white">
                  <Check className="h-3 w-3" strokeWidth={3} aria-hidden="true" />
                </span>
                {item}
              </li>
            ))}
          </ul>

          <div className="mt-6 grid grid-cols-3 gap-3">
            {MINI_STATS.map((stat) => (
              <div key={stat.label} className="rounded-xl border border-slate-100 bg-white px-3 py-3 text-center shadow-sm">
                <p className="text-lg font-extrabold text-[#3B5BFF] sm:text-xl">{stat.value}</p>
                <p className="mt-0.5 text-[10px] font-semibold tracking-[0.14em] text-slate-400 uppercase">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-4">
            <AppLink
              href={ROUTES.peptides}
              className="inline-flex min-h-12 items-center gap-2.5 rounded-xl bg-[#1E3A8A] px-5 py-3 text-[15px] font-semibold text-white shadow-md shadow-blue-900/20 hover:bg-[#172E6E]"
            >
              <ShoppingBag className="h-4 w-4" aria-hidden="true" />
              Shop Now
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </AppLink>
            <p className="flex items-center gap-1.5 text-sm text-slate-500">
              <Check className="h-4 w-4 text-emerald-500" strokeWidth={3} aria-hidden="true" />
              In stock · Ships today
            </p>
          </div>
        </div>
      </div>

      <div className="-mx-4 mt-10 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <div className="flex min-w-[52rem] items-stretch divide-x divide-slate-200 rounded-2xl border border-[#1E3A8A]/20 bg-white py-3.5 shadow-sm lg:min-w-0">
          {TRUST_STRIP.map((item) => (
            <div key={item.title} className="flex min-w-0 flex-1 items-center gap-3 px-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#0B132B] text-white">
                <item.icon className="h-4 w-4" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-bold text-[#0B132B]">{item.title}</p>
                <p className="text-xs text-slate-400">{item.subtitle}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
