import app from 'flarum/forum/app';
import Component from 'flarum/common/Component';
import Avatar from 'flarum/common/components/Avatar';
import translate from '../utils/translate';
import openComposer from '../utils/openComposer';

/**
 * Composer-trigger card that sits above the hero nav pills.
 *
 * Renders the actor's avatar (or a fallback edit-pencil for guests), a prompt,
 * and a primary "+ New Discussion" button. Clicking anywhere on the card
 * programmatically clicks the hidden `.IndexPage-newDiscussion` button that
 * IndexSidebar renders — delegating the whole open-composer flow (async chunk
 * import, guest → LogInModal branch, focus) to Flarum's own handler.
 */
export default class MosaicComposerTrigger extends Component {
  view() {
    const user = app.session.user;
    const placeholder = translate(
      user ? 'home.start_discussion' : 'home.guest_prompt',
      user ? 'Tell everyone what you are working on…' : 'Sign in to start a discussion…'
    );
    const ctaLabel = translate('home.new_discussion', 'New Discussion');

    return (
      <div
        className="MosaicComposerTrigger"
        onclick={() => this.open()}
        role="button"
        tabindex="0"
        onkeydown={(e: KeyboardEvent) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            this.open();
          }
        }}
      >
        <div className="MosaicComposerTrigger-inner">
          {user ? (
            <Avatar user={user} className="MosaicComposerTrigger-avatar" />
          ) : (
            <div className="MosaicComposerTrigger-logo" aria-hidden="true">
              <i className="fas fa-edit" />
            </div>
          )}
          <span className="MosaicComposerTrigger-placeholder">{placeholder}</span>
          <button
            className="MosaicComposerTrigger-newBtn"
            type="button"
            onclick={(e: MouseEvent) => {
              e.stopPropagation();
              this.open();
            }}
          >
            <i className="fas fa-plus" aria-hidden="true" />
            <span className="MosaicComposerTrigger-newBtn-label">{ctaLabel}</span>
          </button>
        </div>
      </div>
    );
  }

  open() {
    openComposer();
  }
}
