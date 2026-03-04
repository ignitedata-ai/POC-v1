/**
 * placeholder.js
 *
 * Custom TipTap node extension for structured placeholders.
 *
 * Placeholders are inline, atomic nodes rendered as colored pills
 * in the editor. They carry structured metadata (key, label, type,
 * required, helpText, options) as node attributes.
 *
 * This is the core of the template variable system. Placeholders
 * cannot be accidentally broken by editing around them because they
 * are atomic (treated as a single unit by ProseMirror).
 */

import { Node, mergeAttributes } from '@tiptap/core';

const Placeholder = Node.create({
  name: 'placeholder',

  // Inline node that appears within text flow
  group: 'inline',
  inline: true,

  // Atomic means the cursor cannot enter the node; it's selected as a whole
  atom: true,

  // Define the attributes stored on each placeholder node
  addAttributes() {
    return {
      id: {
        default: null,
      },
      key: {
        default: '',
      },
      label: {
        default: '',
      },
      type: {
        default: 'text',
      },
      required: {
        default: false,
      },
      helpText: {
        default: '',
      },
      options: {
        default: [],
      },
    };
  },

  /**
   * How TipTap parses HTML back into this node (for copy-paste).
   */
  parseHTML() {
    return [
      {
        tag: 'span[data-placeholder]',
      },
    ];
  },

  /**
   * How TipTap renders this node to HTML.
   */
  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        'data-placeholder': '',
        'data-key': HTMLAttributes.key,
        'data-label': HTMLAttributes.label,
        class: 'placeholder-pill',
      }),
      HTMLAttributes.label || HTMLAttributes.key,
    ];
  },

  /**
   * Keyboard handling: allow backspace/delete to remove placeholder nodes.
   */
  addKeyboardShortcuts() {
    return {
      Backspace: () =>
        this.editor.commands.command(({ tr, state }) => {
          let isPlaceholder = false;
          const { selection } = state;
          const { empty, anchor } = selection;

          if (!empty) return false;

          state.doc.nodesBetween(anchor - 1, anchor, (node, pos) => {
            if (node.type.name === this.name) {
              isPlaceholder = true;
              tr.insertText('', pos, pos + node.nodeSize);
            }
          });

          return isPlaceholder;
        }),
    };
  },
});

export default Placeholder;
