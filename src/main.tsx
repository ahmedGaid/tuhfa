import { render } from 'preact';
import './ui/fonts';
import './ui/theme.css';
import { App } from './ui/App';
import { startRouter } from './ui/router';
import { initProgress } from './state/progress';
import { applyTheme } from './state/settings';

initProgress();
applyTheme();
startRouter();
render(<App />, document.getElementById('app')!);
