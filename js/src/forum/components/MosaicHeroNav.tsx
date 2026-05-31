import app from 'flarum/forum/app';
import Component from 'flarum/common/Component';
import LinkButton from 'flarum/common/components/LinkButton';
import type Mithril from 'mithril';
import translate from '../utils/translate';
import marketplaceUrlHelper from '../utils/marketplaceUrl';

/**
 * Inline pill-row nav under the hero.
 *
 * Built from mosaic's own destinations — Discussions always, plus Tickets /
 * Marketplace when those extensions are detected via their forum attributes.
 * This replaces the previous approach of imperatively `new IndexSidebar()`-ing
 * to harvest its navItems list, which bypassed the Mithril component contract
 * (a constructor/navItems that read this.attrs/this.state would silently
 * misbehave) and hid failures behind a try/catch. Mirrors how index.ts
 * populates IndexSidebar.navItems with mosaic's own items.
 *
 * Hidden on phone — Flarum's stock .App-titleControl SelectDropdown already
 * provides the phone nav surface.
 */
export default class MosaicHeroNav extends Component {
  view(): Mithril.Children {
    const pills: Mithril.Children[] = [
      <LinkButton
        href={app.route('index')}
        icon="fa-solid fa-comments"
        className="MosaicHeaderNav-item"
      >
        {translate('nav.discussions', 'Discussions')}
      </LinkButton>,
    ];

    const supportUrl = app.forum.attribute<string>('supportUrl');
    if (supportUrl) {
      pills.push(
        <LinkButton href={supportUrl} icon="fa-solid fa-headset" className="MosaicHeaderNav-item">
          {translate('nav.tickets', 'Tickets')}
        </LinkButton>
      );
    }

    const hasMarketplace = !!(
      app.forum.attribute<string>('marketplaceUrl') ||
      app.forum.attribute<string>('marketplace_shop_path')
    );
    if (hasMarketplace) {
      pills.push(
        <LinkButton
          href={marketplaceUrlHelper()}
          icon="fa-solid fa-store"
          className="MosaicHeaderNav-item"
        >
          {translate('nav.marketplace', 'Marketplace')}
        </LinkButton>
      );
    }

    return (
      <nav className="MosaicHeroNav" aria-label="Sections">
        {pills}
      </nav>
    );
  }
}
