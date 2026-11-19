/** First visit only (T045, spec US1 scenario 1): «نقطة», what this is, and the credit to the Sheikh. */
import { markWelcomeSeen } from '../../state/settings.ts';
import { Mascot } from '../components/Mascot.tsx';
import { Button } from '../components/ui.tsx';
import { t } from '../strings.ar.ts';
import './Welcome.css';

export function Welcome() {
  return (
    <section class="welcome" aria-labelledby="welcome-title">
      <Mascot pose="idle" size={120} />
      <h1 id="welcome-title" class="welcome__title">
        {t.welcome.title}
      </h1>
      <p class="welcome__body">{t.welcome.body}</p>
      <p class="welcome__credit">{t.welcome.credit}</p>
      <Button onClick={markWelcomeSeen} autoFocus>
        {t.welcome.start}
      </Button>
    </section>
  );
}
