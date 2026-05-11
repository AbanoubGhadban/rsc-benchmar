import { createPages } from 'waku';
import type { PathsForPages } from 'waku/router';

import HomePage from './pages/index';

const pages: PathsForPages = {
  '/': HomePage,
};

export default createPages(async (pagesFn) => {
  pagesFn(pages);
});
