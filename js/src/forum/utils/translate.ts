import app from 'flarum/forum/app';
import type Mithril from 'mithril';

/**
 * Safe wrapper around app.translator.trans() that returns the fallback
 * string when the key isn't registered.
 *
 * Flarum's translator returns the lookup key unchanged when no translation
 * exists, so `trans('foo') || 'bar'` evaluates to 'foo' (truthy) and the
 * fallback never fires. We compare against the key and substitute on miss.
 *
 * Extracted here so HeaderNav / HeroPanel / MosaicComposerTrigger share one
 * implementation instead of three verbatim copies.
 */
export default function translate(suffix: string, fallback: string): Mithril.Children {
  const key = `ernestdefoe-mosaic.forum.${suffix}`;
  try {
    const out = app.translator.trans(key);
    if (out == null) return fallback;
    if (typeof out === 'string' && out === key) return fallback;
    return out;
  } catch (e) {
    return fallback;
  }
}
