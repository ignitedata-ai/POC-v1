/**
 * placeholderReact.jsx
 *
 * Extends the base Placeholder node with a React NodeView.
 * This connects the PlaceholderNodeView component to TipTap's
 * rendering pipeline so each placeholder node in the document
 * renders as an interactive React component (pill with popover).
 */

import { ReactNodeViewRenderer } from '@tiptap/react';
import Placeholder from './placeholder.js';
import PlaceholderNodeView from '../components/PlaceholderNodeView.jsx';

const PlaceholderReact = Placeholder.extend({
  addNodeView() {
    return ReactNodeViewRenderer(PlaceholderNodeView, {
      // Let click/mousedown events reach the React pill component
      // so it can toggle the edit popover. The popover itself is rendered
      // via Portal outside the editor DOM, so it needs no special handling.
      stopEvent: (event) => {
        return event.type === 'mousedown' || event.type === 'click';
      },
    });
  },
});

export default PlaceholderReact;
