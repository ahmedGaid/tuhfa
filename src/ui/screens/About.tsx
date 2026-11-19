/** «عن تحفة» (T058, FR-019): the Sheikh's credit (exact text), the Tanzil credit + link, version. */
import { Mascot } from '../components/Mascot.tsx';
import { href } from '../router.ts';
import { t } from '../strings.ar.ts';
import { ChannelButton } from './Library.tsx';
import './About.css';

export function About() {
  return (
    <article class="about" aria-labelledby="about-h">
      <a class="lib__back" href={href('me')}>
        → {t.about.back}
      </a>
      <Mascot pose="idle" size={72} />
      <h1 id="about-h">{t.about.title}</h1>
      <p>{t.about.body}</p>
      <p class="about__credit">{t.credit}</p>
      <ChannelButton />
      <section aria-labelledby="about-quran">
        <h2 id="about-quran">{t.about.quranTitle}</h2>
        <p>
          {t.about.quran}{' '}
          <a href="https://tanzil.net" target="_blank" rel="noopener noreferrer" dir="ltr">
            {t.about.quranLink}
          </a>
        </p>
      </section>
      <p class="about__mute">{t.about.privacy}</p>
      <p class="about__mute" dir="auto">
        {t.about.version(__APP_VERSION__)}
      </p>
    </article>
  );
}
