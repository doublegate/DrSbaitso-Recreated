/** The app version, read from package.json at build time (Vite inlines only this field). */
import { version } from '../package.json';

export const APP_VERSION: string = version;
