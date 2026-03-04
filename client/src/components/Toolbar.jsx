/**
 * Toolbar.jsx
 *
 * Editor toolbar with formatting controls, table insertion,
 * and the "Insert Placeholder" button. Connected to the TipTap
 * editor instance to toggle marks, set headings, and manage lists.
 */

import React from 'react';

export default function Toolbar({ editor, onInsertPlaceholder, onSave, saving, onDelete, deleting }) {
  if (!editor) return null;

  return (
    <div className="toolbar">
      <div className="toolbar-group">
        <button
          className={`toolbar-btn ${editor.isActive('bold') ? 'active' : ''}`}
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Bold"
        >
          <strong>B</strong>
        </button>
        <button
          className={`toolbar-btn ${editor.isActive('italic') ? 'active' : ''}`}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Italic"
        >
          <em>I</em>
        </button>
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-group">
        <button
          className={`toolbar-btn ${editor.isActive('heading', { level: 1 }) ? 'active' : ''}`}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          title="Heading 1"
        >
          H1
        </button>
        <button
          className={`toolbar-btn ${editor.isActive('heading', { level: 2 }) ? 'active' : ''}`}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          title="Heading 2"
        >
          H2
        </button>
        <button
          className={`toolbar-btn ${editor.isActive('heading', { level: 3 }) ? 'active' : ''}`}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          title="Heading 3"
        >
          H3
        </button>
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-group">
        <button
          className={`toolbar-btn ${editor.isActive('bulletList') ? 'active' : ''}`}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="Bullet List"
        >
          &#8226; List
        </button>
        <button
          className={`toolbar-btn ${editor.isActive('orderedList') ? 'active' : ''}`}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="Ordered List"
        >
          1. List
        </button>
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-group">
        <button
          className="toolbar-btn"
          onClick={() =>
            editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
          }
          title="Insert Table"
        >
          Table
        </button>
        {editor.isActive('table') && (
          <>
            <button
              className="toolbar-btn toolbar-btn-sm"
              onClick={() => editor.chain().focus().addColumnAfter().run()}
              title="Add Column"
            >
              +Col
            </button>
            <button
              className="toolbar-btn toolbar-btn-sm"
              onClick={() => editor.chain().focus().addRowAfter().run()}
              title="Add Row"
            >
              +Row
            </button>
            <button
              className="toolbar-btn toolbar-btn-sm toolbar-btn-danger"
              onClick={() => editor.chain().focus().deleteTable().run()}
              title="Delete Table"
            >
              Del Table
            </button>
          </>
        )}
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-group">
        <button
          className="toolbar-btn toolbar-btn-placeholder"
          onClick={onInsertPlaceholder}
          title="Insert Placeholder"
        >
          + Placeholder
        </button>
      </div>

      <div className="toolbar-spacer" />

      <div className="toolbar-group toolbar-group-actions">
        <button
          className="toolbar-btn toolbar-btn-save"
          onClick={onSave}
          disabled={saving}
          title="Save Template"
        >
          {saving ? 'Saving...' : 'Save Template'}
        </button>
        <button
          className="toolbar-btn toolbar-btn-delete"
          onClick={onDelete}
          disabled={deleting}
          title="Delete Template"
        >
          {deleting ? 'Deleting...' : 'Delete'}
        </button>
      </div>
    </div>
  );
}
