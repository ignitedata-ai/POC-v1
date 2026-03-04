/**
 * App.jsx
 *
 * Main application component. Orchestrates the 3-column layout:
 *   Left:   Template list with Add New F-Tag button and search
 *   Center: TipTap rich text editor with toolbar
 *   Right:  Fields panel (live placeholder metadata extraction)
 *
 * Manages application state including: template list, selected template,
 * editor content, save/load operations, and all 4 template creation flows.
 */

import React, { useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import Document from '@tiptap/extension-document';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import Bold from '@tiptap/extension-bold';
import Italic from '@tiptap/extension-italic';
import Heading from '@tiptap/extension-heading';
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';
import ListItem from '@tiptap/extension-list-item';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import HorizontalRule from '@tiptap/extension-horizontal-rule';
import HardBreak from '@tiptap/extension-hard-break';
import History from '@tiptap/extension-history';

import PlaceholderReact from './extensions/placeholderReact.jsx';
import TemplateList from './components/TemplateList.jsx';
import FieldsPanel from './components/FieldsPanel.jsx';
import Toolbar from './components/Toolbar.jsx';
import InsertPlaceholderModal from './components/InsertPlaceholderModal.jsx';
import CreateTemplateModal from './components/CreateTemplateModal.jsx';
import AddFTagButton from './components/AddFTagButton.jsx';
import SearchBar from './components/SearchBar.jsx';
import Toast from './components/Toast.jsx';
import {
  fetchTemplates,
  fetchTemplate,
  updateTemplate,
  createTemplate,
  deleteTemplate,
  fetchGenericTemplate,
  uploadPdfTemplate,
} from './services/api.js';
import { extractFields } from './services/fieldExtractor.js';

export default function App() {
  // Application state
  const [templates, setTemplates] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fields, setFields] = useState([]);
  const [showInsertModal, setShowInsertModal] = useState(false);
  const [toast, setToast] = useState(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Fields panel collapsed state (collapsed by default)
  const [fieldsPanelOpen, setFieldsPanelOpen] = useState(false);

  // Delete state
  const [deletingTemplate, setDeletingTemplate] = useState(false);

  // Create template modal state
  const [createFlowType, setCreateFlowType] = useState(null);
  const [creatingTemplate, setCreatingTemplate] = useState(false);

  // Initialize the TipTap editor with all required extensions
  const editor = useEditor({
    extensions: [
      Document,
      Paragraph,
      Text,
      Bold,
      Italic,
      Heading.configure({ levels: [1, 2, 3] }),
      BulletList,
      OrderedList,
      ListItem,
      Table.configure({ resizable: false }),
      TableRow,
      TableCell,
      TableHeader,
      HorizontalRule,
      HardBreak,
      History,
      PlaceholderReact,
    ],
    content: null,
    editable: false,
    onUpdate: ({ editor }) => {
      const json = editor.getJSON();
      const extracted = extractFields(json);
      setFields(extracted);
    },
  });

  // Load template list on mount
  useEffect(() => {
    loadTemplateList();
  }, []);

  async function loadTemplateList() {
    try {
      setLoadingList(true);
      const data = await fetchTemplates();
      setTemplates(data);
    } catch (err) {
      console.error('Failed to load templates:', err);
      showToast('Failed to load template list', 'error');
    } finally {
      setLoadingList(false);
    }
  }

  // Load a specific template into the editor
  async function handleSelectTemplate(templateId) {
    if (!editor) return;

    try {
      setLoadingTemplate(true);
      setSelectedId(templateId);

      const data = await fetchTemplate(templateId);
      const contentJson = JSON.parse(data.version.content_json);

      editor.commands.setContent(contentJson);
      editor.setEditable(true);

      const extracted = extractFields(contentJson);
      setFields(extracted);
    } catch (err) {
      console.error('Failed to load template:', err);
      showToast('Failed to load template', 'error');
    } finally {
      setLoadingTemplate(false);
    }
  }

  // Save the current editor content to the backend
  async function handleSave() {
    if (!editor || !selectedId) return;

    try {
      setSaving(true);
      const contentJson = editor.getJSON();
      await updateTemplate(selectedId, { content_json: contentJson });
      showToast('Template saved successfully', 'success');
      loadTemplateList();
    } catch (err) {
      console.error('Failed to save template:', err);
      showToast('Failed to save template', 'error');
    } finally {
      setSaving(false);
    }
  }

  // Soft-delete the currently selected template
  async function handleDelete() {
    if (!selectedId) return;

    const template = templates.find((t) => t.id === selectedId);
    const label = template ? `${template.f_tag} – ${template.title}` : `Template #${selectedId}`;

    if (!window.confirm(`Are you sure you want to delete "${label}"?\n\nThis will remove it from the template list.`)) {
      return;
    }

    try {
      setDeletingTemplate(true);
      await deleteTemplate(selectedId);
      showToast(`Template "${label}" deleted`, 'success');

      // Clear the editor and deselect
      setSelectedId(null);
      if (editor) {
        editor.commands.setContent(null);
        editor.setEditable(false);
      }
      setFields([]);

      // Refresh the template list
      await loadTemplateList();
    } catch (err) {
      console.error('Failed to delete template:', err);
      showToast(err.message || 'Failed to delete template', 'error');
    } finally {
      setDeletingTemplate(false);
    }
  }

  // Insert a placeholder node at the current cursor position
  function handleInsertPlaceholder(attrs) {
    if (!editor) return;
    editor.chain().focus().insertContent({ type: 'placeholder', attrs }).run();
  }

  // Handle Add F-Tag button option selection
  function handleAddFTagOption(optionId) {
    setCreateFlowType(optionId);
  }

  // Handle template creation from modal submission
  async function handleCreateTemplate(formData) {
    const { flowType, fTag, fTagNumber, title, pdfFile, duplicateFromId } = formData;

    try {
      setCreatingTemplate(true);
      let result;

      switch (flowType) {
        case 'upload-pdf': {
          result = await uploadPdfTemplate(pdfFile, fTag, title);
          showToast(`Template ${fTag} created from PDF`, 'success');
          break;
        }

        case 'from-template': {
          const genericData = await fetchGenericTemplate(fTagNumber, title);
          const contentJson = JSON.parse(genericData.content_json);
          result = await createTemplate({
            f_tag: fTag,
            title,
            content_json: contentJson,
          });
          showToast(`Template ${fTag} created from template`, 'success');
          break;
        }

        case 'duplicate': {
          const sourceData = await fetchTemplate(duplicateFromId);
          const sourceContent = JSON.parse(sourceData.version.content_json);
          result = await createTemplate({
            f_tag: fTag,
            title,
            content_json: sourceContent,
          });
          showToast(`Template ${fTag} duplicated successfully`, 'success');
          break;
        }

        case 'blank': {
          const blankContent = {
            type: 'doc',
            content: [
              {
                type: 'heading',
                attrs: { level: 1 },
                content: [{ type: 'text', text: `${fTag} \u2013 ${title}` }],
              },
              { type: 'paragraph', content: [] },
            ],
          };
          result = await createTemplate({
            f_tag: fTag,
            title,
            content_json: blankContent,
          });
          showToast(`Blank template ${fTag} created`, 'success');
          break;
        }
      }

      // Close modal, refresh list, and select the new template by its ID
      setCreateFlowType(null);
      await loadTemplateList();
      if (result?.template?.id) {
        handleSelectTemplate(result.template.id);
      }
    } catch (err) {
      console.error('Failed to create template:', err);
      showToast(err.message || 'Failed to create template', 'error');
    } finally {
      setCreatingTemplate(false);
    }
  }

  function showToast(message, type = 'success') {
    setToast({ message, type });
  }

  // Filter templates by search query
  const filteredTemplates = templates.filter((t) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return t.f_tag.toLowerCase().includes(q) || t.title.toLowerCase().includes(q);
  });

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <img src="/tcs-logo.png" alt="TCS Logo" className="app-header-logo" />
        <div className="app-header-brand">
          <h1>Template Repository</h1>
          <span className="app-header-subtitle">F-Tag Correction Packet Manager</span>
        </div>
      </header>

      {/* Main 3-column layout */}
      <main className="app-main">
        {/* Left: Template List with Add button and Search */}
        <aside className="app-sidebar-left">
          <div className="sidebar-top-controls">
            <AddFTagButton onSelect={handleAddFTagOption} />
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search F-Tags..."
            />
          </div>
          <TemplateList
            templates={filteredTemplates}
            selectedId={selectedId}
            onSelect={handleSelectTemplate}
            loading={loadingList}
          />
        </aside>

        {/* Center: Editor */}
        <section className="app-editor-section">
          {selectedId ? (
            <>
              <Toolbar
                editor={editor}
                onInsertPlaceholder={() => setShowInsertModal(true)}
                onSave={handleSave}
                saving={saving}
                onDelete={handleDelete}
                deleting={deletingTemplate}
              />
              <div className="editor-container">
                {loadingTemplate ? (
                  <div className="editor-loading">Loading template...</div>
                ) : (
                  <EditorContent editor={editor} className="editor-content" />
                )}
              </div>
            </>
          ) : (
            <div className="editor-empty-state">
              <div className="editor-empty-icon">&#9998;</div>
              <h2>Select a Template</h2>
              <p>Choose an F-Tag template from the left panel to begin editing, or create a new one.</p>
            </div>
          )}
        </section>

        {/* Right: Fields Panel (collapsible) */}
        <aside className={`app-sidebar-right ${fieldsPanelOpen ? 'open' : 'collapsed'}`}>
          <button
            className="fields-toggle-btn"
            onClick={() => setFieldsPanelOpen(!fieldsPanelOpen)}
            title={fieldsPanelOpen ? 'Collapse Fields' : 'Expand Fields'}
          >
            <span className="fields-toggle-icon">{fieldsPanelOpen ? '›' : '‹'}</span>
            {!fieldsPanelOpen && (
              <span className="fields-toggle-label">
                Fields {fields.length > 0 && <span className="fields-toggle-count">{fields.length}</span>}
              </span>
            )}
          </button>
          {fieldsPanelOpen && <FieldsPanel fields={fields} />}
        </aside>
      </main>

      {/* Insert Placeholder Modal */}
      <InsertPlaceholderModal
        isOpen={showInsertModal}
        onClose={() => setShowInsertModal(false)}
        onInsert={handleInsertPlaceholder}
      />

      {/* Create Template Modal (all 4 flows) */}
      <CreateTemplateModal
        isOpen={!!createFlowType}
        flowType={createFlowType}
        onClose={() => setCreateFlowType(null)}
        onSubmit={handleCreateTemplate}
        templates={templates}
        submitting={creatingTemplate}
      />

      {/* Toast Notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
