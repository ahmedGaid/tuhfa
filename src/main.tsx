import { render } from 'preact';
import './ui/fonts';
import './ui/theme.css';
import { App } from './ui/App';
import { startRouter } from './ui/router';

startRouter();
render(<App />, document.getElementById('app')!);
