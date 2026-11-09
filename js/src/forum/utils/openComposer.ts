import app from 'flarum/forum/app';

/**
 * Open Flarum's new-discussion composer.
 *
 * Flarum 2 chunk-splits DiscussionComposer / LogInModal, so a static import
 * resolves to undefined until the chunk loads. Instead we click the hidden
 * `.IndexPage-newDiscussion` button IndexSidebar renders, reusing Flarum's own
 * handler (which lazy-loads the chunk and handles the guest → LogInModal
 * branch). If the user isn't on IndexPage we route there first, then click once
 * the button mounts (polling via rAF, 1.5 s ceiling).
 *
 * This is a deliberate compatibility shim. It lives here as the single shared
 * implementation (HeaderNav + MosaicComposerTrigger both call it) so there's
 * one place to swap if Flarum exposes a stable composer-open API.
 */
export default function openComposer(): void {
  const existing = document.querySelector('.IndexPage-newDiscussion');
  if (existing instanceof HTMLElement) {
    existing.click();
    return;
  }

  m.route.set(app.route('index'));

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
