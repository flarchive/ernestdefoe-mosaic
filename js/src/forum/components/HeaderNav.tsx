import app from 'flarum/forum/app';
import LinkButton from 'flarum/common/components/LinkButton';
import Button from 'flarum/common/components/Button';
import type Mithril from 'mithril';
import translate from '../utils/translate';

/**
 * Builds the items injected into the hero nav.
 *
 * Only "Discussions" is hardcoded. Every other destination (Support /
 * Marketplace / Tags) is contributed by its own extension into
 * IndexSidebar.navItems, which MosaicHeroNav mirrors — hardcoding them here
 * would produce duplicate pills.
 */
export function navItems(): Mithril.Children[] {
  const items: Mithril.Children[] = [];

  items.push(
    <LinkButton
      href={app.route('index')}
      icon="fa-solid fa-comments"
      className="MosaicHeaderNav-item"
    >
      {translate('nav.discussions', 'Discussions')}
    </LinkButton>
  );

  /* Extension-contributed nav items (Support / Tickets, Marketplace / Shop,
   * Tags, etc.) are intentionally NOT hardcoded here. Every well-behaved
   * Flarum 2 extension registers its own entries into IndexSidebar.navItems —
   * MosaicHeroNav mirrors that list and wraps each entry in a pill
   * automatically. Hardcoding extension-specific pills here produces
   * duplicates (the extension's contribution + mosaic's). */

  /* Tags intentionally omitted. flarum/tags adds its own 'tags' entry to
   * IndexSidebar.navItems; MosaicHeroNav filters that out so neither Tags
   * link surfaces in the hero pill row. The CategoryTiles grid above the pill
   * row is the canonical tag entry point. */

  return items;
}

/**
 * The primary CTA in the header.
 *
 * Context-aware: on a /support* route the button reads "Start a Ticket" and
 * navigates to /support/new (linkrobins/support's composition page).
 * Otherwise it opens Flarum's stock DiscussionComposer — or the login modal
 * for guests.
 */
export function startDiscussionButton(): Mithril.Children {
  const inTickets = isTicketsRoute();
  return (
    <Button
      className="Button Button--primary MosaicHeaderNav-start"
      icon={inTickets ? 'fa-solid fa-headset' : 'fa-solid fa-edit'}
      onclick={inTickets ? startTicket : startDiscussion}
    >
      {inTickets
        ? translate('nav.start_ticket', 'Start a Ticket')
        : translate('nav.start_discussion', 'Start a Discussion')}
    </Button>
  );
}

/** True when the current URL is the support extension's section. */
function isTicketsRoute(): boolean {
  try {
    const path = (window.location?.pathname || '').replace(/\/+$/, '');
    if (!path) return false;
    return path === '/support' || path.startsWith('/support/');
  } catch (e) {
    return false;
  }
}

/**
 * Open the new-discussion composer.
 *
 * Flarum 2 chunk-splits DiscussionComposer / LogInModal, so a static import
 * resolves to undefined until the chunk loads. Instead we click the hidden
 * `.IndexPage-newDiscussion` button IndexSidebar renders, reusing Flarum's
 * own handler (which lazy-loads the chunk and handles the guest → LogInModal
 * branch). If the user isn't on IndexPage we route there first, then click
 * once the button mounts.
 */
function startDiscussion(): void {
  const existing = document.querySelector('.IndexPage-newDiscussion');
  if (existing instanceof HTMLElement) {
    existing.click();
    return;
  }
  m.route.set(app.route('index'));
  /* Poll for the newDiscussion button via rAF until it appears, 1.5 s
   * ceiling — more reliable than a fixed setTimeout on slow devices. */
  const deadline = performance.now() + 1500;
  const tick = () => {
    const btn = document.querySelector('.IndexPage-newDiscussion');
    if (btn instanceof HTMLElement) {
      btn.click();
      return;
    }
    if (performance.now() < deadline) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

/**
 * Navigate to the support extension's new-ticket page. linkrobins/support
 * exposes /support/new as the composition surface; the supportUrl forum
 * attribute is honored if set.
 */
function startTicket(): void {
  const base = String(app.forum.attribute<string>('supportUrl') || '/support').replace(/\/+$/, '');
  m.route.set(`${base}/new`);
}
