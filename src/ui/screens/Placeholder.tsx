import { Mascot } from '../components/Mascot';
import './Placeholder.css';

/** Designed "coming in a later milestone" state — never a blank screen (ag-ui-standard rule 9). */
export function Placeholder({ title, body }: { title: string; body: string }) {
  return (
    <section class="placeholder">
      <Mascot pose="think" size={88} />
      <h1>{title}</h1>
      <p>{body}</p>
    </section>
  );
}
