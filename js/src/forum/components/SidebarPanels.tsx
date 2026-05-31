import Component from 'flarum/common/Component';
import app from 'flarum/forum/app';
import type Mithril from 'mithril';
import type User from 'flarum/common/models/User';
import type Discussion from 'flarum/common/models/Discussion';
import marketplaceUrlHelper from '../utils/marketplaceUrl';

type IconStyle = Record<string, string | number>;

/* Inline icon helper — Flarum 2 removed flarum/common/helpers/icon. */
const fa = (name: string, style?: IconStyle): Mithril.Children => (
  <i className={`icon ${name}`} style={style} aria-hidden="true" />
);

interface QuickAction {
  icon?: string;
  label?: string;
  href?: string;
}

interface Contributor {
  name: string;
  role?: string | null;
  meta?: string;
  points?: string | number;
  tone?: string;
  avatarUrl?: string | null;
  href?: string;
}

/** app.route.user is core, but typed defensively for older typings. */
type RouteWithUser = typeof app.route & { user?: (user: User) => string };

/** participantCount isn't in the core Discussion typings; declare it locally. */
type DiscussionLike = Discussion & { participantCount?: () => number };

/**
 * SidebarPanels — the stack of right-sidebar cards:
 *   Marketplace · Quick Actions · Top Contributors · Trending
 *
 * Each panel pulls real data when an obvious source exists and falls back to
 * sensible defaults otherwise. Hide a panel by setting the corresponding
 * mosaicHide* forum attribute to true.
 */
export default class SidebarPanels extends Component {
  view() {
    return (
      <div className="MosaicSidebarPanels">
        {!app.forum.attribute<boolean>('mosaicHideMarketplacePromo') && this.marketplacePromo()}
        {!app.forum.attribute<boolean>('mosaicHideQuickActions') && this.quickActions()}
        {!app.forum.attribute<boolean>('mosaicHideTopContributors') && this.topContributors()}
        {!app.forum.attribute<boolean>('mosaicHideTrending') && this.trending()}
      </div>
    );
  }

  quickActions(): Mithril.Children {
    /* Admin-configured rows win; otherwise built-in defaults plus
     * auto-detected support/marketplace integrations. */
    const fromAttr = app.forum.attribute<QuickAction[]>('mosaicQuickActions');
    const configured = Array.isArray(fromAttr)
      ? fromAttr.filter((a) => a && (a.label || '').trim() && (a.href || '').trim())
      : [];

    let links: QuickAction[];
    if (configured.length) {
      links = configured;
    } else {
      links = [
        {
          icon: 'fa-solid fa-plus',
          label: 'Start a Discussion',
          href: app.route('index') + '?composer',
        },
        { icon: 'fa-solid fa-tags', label: 'Browse Tags', href: app.route('tags') || '/tags' },
        { icon: 'fa-solid fa-clock', label: 'Recent Activity', href: '/all' },
      ];

      const supportUrl = app.forum.attribute<string>('supportUrl');
      if (supportUrl) {
        links.unshift({
          icon: 'fa-solid fa-headset',
          label: 'Open a Support Ticket',
          href: supportUrl,
        });
      }
      const shopPath = app.forum.attribute<string>('marketplace_shop_path');
      const marketplaceUrl =
        app.forum.attribute<string>('marketplaceUrl') ||
        (shopPath ? '/' + String(shopPath).replace(/^\//, '') : null);
      if (marketplaceUrl) {
        links.push({
          icon: 'fa-solid fa-store',
          label: 'Visit the Marketplace',
          href: marketplaceUrl,
        });
      }
    }

    return (
      <div className="MosaicSideCard">
        <h3 className="MosaicSideCard-title">
          {fa('fa-solid fa-bolt', { color: 'var(--primary)' })}
          <span>Quick Actions</span>
        </h3>
        {links.map((l) => (
          <a className="MosaicQuickAction" href={l.href}>
            <span className="MosaicQuickAction-ic">{fa(l.icon || 'fa-solid fa-link')}</span>
            <span>{l.label}</span>
          </a>
        ))}
      </div>
    );
  }

  topContributors(): Mithril.Children {
    /* Operator-provided list wins. */
    const fromAttr = app.forum.attribute<Contributor[]>('mosaicTopContributors');
    if (Array.isArray(fromAttr) && fromAttr.length) {
      return this.renderContribCard(fromAttr.map((c) => ({ ...c })));
    }

    /* Otherwise rank real users from the store by commentCount. */
    const users = (app.store.all('users') as User[]) || [];
    const ranked = users
      .filter((u) => u && typeof u.commentCount === 'function' && (u.commentCount() || 0) > 0)
      .sort((a, b) => (b.commentCount() || 0) - (a.commentCount() || 0))
      .slice(0, 5);

    /* Hide the panel rather than show fake names when nothing qualifies. */
    if (ranked.length < 1) return null;

    const routeUser = (app.route as RouteWithUser).user;
    const tones = ['blue', 'green', 'amber', 'rose', 'purple', 'teal', 'indigo', 'slate'];
    const data: Contributor[] = ranked.map((u, i) => {
      const c = u.commentCount() || 0;
      const d = u.discussionCount() || 0;
      const group = (u.groups?.() || [])[0];
      const role = group ? group.nameSingular?.() : null;
      return {
        name: u.displayName?.() || u.username?.() || '—',
        role: role && /(staff|mod|admin|expert)/i.test(role) ? role : null,
        meta: c === 1 ? '1 post' : `${formatCount(c)} posts`,
        points: formatCount(c + d),
        tone: tones[i % tones.length],
        avatarUrl: u.avatarUrl?.() || null,
        href: routeUser?.(u) || '#',
      };
    });

    return this.renderContribCard(data);
  }

  renderContribCard(contributors: Contributor[]): Mithril.Children {
    return (
      <div className="MosaicSideCard">
        <h3 className="MosaicSideCard-title">
          {fa('fa-solid fa-trophy', { color: 'var(--primary)' })}
          <span>Top Contributors</span>
        </h3>
        {contributors.map((c) => (
          <a className="MosaicContribRow" href={c.href || '#'}>
            {c.avatarUrl ? (
              <img
                className="MosaicContribRow-avatar MosaicContribRow-avatar--img"
                src={c.avatarUrl}
                alt=""
              />
            ) : (
              <div className={`MosaicContribRow-avatar av-${c.tone || 'slate'}`}>
                {initials(c.name)}
              </div>
            )}
            <div className="MosaicContribRow-meta">
              <div className="MosaicContribRow-name">
                {c.name}
                {c.role && (
                  <span
                    className={`MosaicRoleBadge MosaicRoleBadge--${String(c.role).toLowerCase()}`}
                  >
                    {c.role}
                  </span>
                )}
              </div>
              <div className="MosaicContribRow-sub">{c.meta}</div>
            </div>
            <div className="MosaicContribRow-points">{c.points}</div>
          </a>
        ))}
      </div>
    );
  }

  trending(): Mithril.Children {
    /* Rank loaded discussions by participantCount; render only when we have a
     * real discussion to show (no fabricated placeholder rows). */
    let items: { title: string; meta: string; href: string }[] = [];
    try {
      const discussions = (app.store.all('discussions') as DiscussionLike[]) || [];
      items = discussions
        .filter((d) => typeof d.title === 'function')
        .sort((a, b) => (b.participantCount?.() ?? 0) - (a.participantCount?.() ?? 0))
        .slice(0, 4)
        .map((d) => ({
          title: d.title(),
          meta: `${d.commentCount?.() ?? 0} replies`,
          href: app.route.discussion(d),
        }));
    } catch (e) {
      /* ignore — empty items array hides the panel below */
    }

    if (!items.length) return null;

    return (
      <div className="MosaicSideCard">
        <h3 className="MosaicSideCard-title">
          {fa('fa-solid fa-fire', { color: 'var(--primary)' })}
          <span>Trending</span>
        </h3>
        {items.map((t, i) => (
          <a href={t.href} className="MosaicTrendRow">
            <span className={`MosaicTrendRow-num ${i < 2 ? 'is-top' : ''}`}>{i + 1}</span>
            <div>
              <div className="MosaicTrendRow-title">{t.title}</div>
              <div className="MosaicTrendRow-meta">{t.meta}</div>
            </div>
          </a>
        ))}
      </div>
    );
  }

  marketplacePromo(): Mithril.Children {
    const url = marketplaceUrlHelper();
    return (
      <a className="MosaicSideCard MosaicMarketplacePromo" href={url}>
        <div className="MosaicMarketplacePromo-bg">{fa('fa-solid fa-store')}</div>
        <div className="MosaicMarketplacePromo-inner">
          <div className="MosaicMarketplacePromo-kicker">NEW · Marketplace</div>
          <div className="MosaicMarketplacePromo-title">Premium themes &amp; extensions</div>
          <div className="MosaicMarketplacePromo-desc">
            Digital products, services, subscriptions, and private extensions from trusted sellers.
          </div>
          <div className="MosaicMarketplacePromo-cta">
            Browse the store {fa('fa-solid fa-arrow-right', { fontSize: '11px' })}
          </div>
        </div>
      </a>
    );
  }
}

function initials(name: string): string {
  const parts = String(name).trim().split(/\s+/);
  return (parts[0]?.[0] || '') + (parts[parts.length - 1]?.[0] || '');
}

function formatCount(n: number): string {
  const v = Number(n) || 0;
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (v >= 1000) return (v / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  return String(v);
}
