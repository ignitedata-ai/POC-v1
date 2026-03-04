/**
 * POCEditor.jsx
 *
 * Two-panel editor for a single F-Tag deficiency:
 *   Left: Deficiency context (narrative, severity, admin template reference)
 *   Right: 4-step POC form with AI-generated suggestions and user editing
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  generateStepDraft,
  saveStep as apiSaveStep,
  saveDeficiencyCompletionDate,
  fetchSession,
  fetchAdminTemplate,
  fetchAssistQuestions,
  generateAssistedDraft,
} from '../services/api.js';

const STEP_ICONS = ['\u26A0\uFE0F', '\uD83D\uDD0D', '\uD83C\uDF93', '\uD83D\uDCCA'];
const STEP_SHORT_LABELS = ['Immediate Action', 'Scope & Impact', 'Education', 'Monitoring'];

export default function POCEditor({ deficiency: initialDef, sessionId, onBack }) {
  const [deficiency, setDeficiency] = useState(initialDef);
  const [steps, setSteps] = useState(initialDef.steps || []);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [generatingStep, setGeneratingStep] = useState(null); // step index being generated
  const [regeneratedStep, setRegeneratedStep] = useState(null); // step index with fresh regeneration
  const [savingStep, setSavingStep] = useState(null);
  const [error, setError] = useState(null);
  const [showNarrative, setShowNarrative] = useState(false);
  const [savedIndicator, setSavedIndicator] = useState(null);
  const [leftTab, setLeftTab] = useState('deficiency'); // 'deficiency' | 'guide'
  const [templateData, setTemplateData] = useState(null);
  const [templateLoading, setTemplateLoading] = useState(false);
  // guidance state removed — AI classification replaced by AI Assist
  const [completionDate, setCompletionDate] = useState(initialDef.completionDate || '');
  // AI Assist state
  const [assistModalOpen, setAssistModalOpen] = useState(false);
  const [assistQuestions, setAssistQuestions] = useState(null); // array of question objects
  const [assistAnswers, setAssistAnswers] = useState({}); // { q1: "answer", q2: "answer" }
  const [assistLoading, setAssistLoading] = useState(false); // loading questions
  const [assistGenerating, setAssistGenerating] = useState(false); // generating draft from answers
  const saveTimers = useRef({});
  const dateTimer = useRef(null);

  // Reload deficiency data from server to get latest state
  const reloadDeficiency = useCallback(async () => {
    try {
      const result = await fetchSession(sessionId);
      const updated = result.deficiencies.find((d) => d.id === deficiency.id);
      if (updated) {
        setDeficiency(updated);
        setSteps(updated.steps);
        if (updated.completionDate) setCompletionDate(updated.completionDate);
      }
    } catch (err) {
      console.warn('Could not reload deficiency:', err.message);
    }
  }, [sessionId, deficiency.id]);

  useEffect(() => {
    reloadDeficiency();
  }, [reloadDeficiency]);

  // Fetch admin template content for guidance panel
  useEffect(() => {
    if (!deficiency.adminTemplateId) return;
    let cancelled = false;
    setTemplateLoading(true);
    fetchAdminTemplate(deficiency.adminTemplateId)
      .then((data) => {
        if (cancelled) return;
        const contentJson = data?.version?.content_json || data?.content_json;
        if (contentJson) {
          const parsed = typeof contentJson === 'string' ? JSON.parse(contentJson) : contentJson;
          setTemplateData(parsed);
        }
      })
      .catch((err) => {
        console.warn('Could not load template:', err.message);
      })
      .finally(() => {
        if (!cancelled) setTemplateLoading(false);
      });
    return () => { cancelled = true; };
  }, [deficiency.adminTemplateId]);

  // Template guidance classification removed — replaced by AI Assist questionnaire

  // AI Assist: open modal and load questions
  async function handleOpenAssist(stepIndex) {
    const step = steps[stepIndex];
    if (!step) return;

    setAssistModalOpen(true);
    setAssistLoading(true);
    setAssistQuestions(null);
    // Pre-fill with any saved answers
    setAssistAnswers(step.assistAnswers || {});

    try {
      const result = await fetchAssistQuestions(deficiency.id, step.stepNumber);
      setAssistQuestions(result.questions);
      // If there are saved answers from the server, use those
      if (result.answers && Object.keys(result.answers).length > 0) {
        setAssistAnswers((prev) => ({ ...result.answers, ...prev }));
      }
    } catch (err) {
      setError(err.message);
      setAssistModalOpen(false);
    } finally {
      setAssistLoading(false);
    }
  }

  // AI Assist: generate draft from user answers
  async function handleAssistGenerate() {
    const step = steps[activeStepIndex];
    if (!step) return;

    // Check at least one answer is provided
    const hasAnswer = Object.values(assistAnswers).some((a) => a && a.trim());
    if (!hasAnswer) {
      setError('Please answer at least one question before generating.');
      return;
    }

    setAssistGenerating(true);
    setError(null);
    try {
      const result = await generateAssistedDraft(deficiency.id, step.stepNumber, assistAnswers);
      // Put the generated content into the textarea
      handleStepContentChange(activeStepIndex, result.content);
      // Update local step with saved answers
      setSteps((prev) =>
        prev.map((s, i) => (i === activeStepIndex ? { ...s, assistAnswers: { ...assistAnswers } } : s))
      );
      setAssistModalOpen(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setAssistGenerating(false);
    }
  }

  async function handleGenerateStepDraft(stepIndex) {
    const step = steps[stepIndex];
    if (!step) return;

    setError(null);
    setGeneratingStep(stepIndex);
    try {
      const result = await generateStepDraft(deficiency.id, step.stepNumber);
      setSteps((prev) =>
        prev.map((s, i) => (i === stepIndex ? { ...s, aiSuggestion: result.aiSuggestion } : s))
      );
      // If the step already has user content, flag it so the UI shows the new suggestion
      if (step.userContent) {
        setRegeneratedStep(stepIndex);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setGeneratingStep(null);
    }
  }

  function handleStepContentChange(stepIndex, value) {
    setSteps((prev) =>
      prev.map((s, i) => (i === stepIndex ? { ...s, userContent: value } : s))
    );
    debouncedSave(stepIndex, { userContent: value });
  }

  function handleCompletionDateChange(value) {
    setCompletionDate(value);
    if (dateTimer.current) clearTimeout(dateTimer.current);
    dateTimer.current = setTimeout(async () => {
      try {
        await saveDeficiencyCompletionDate(deficiency.id, value);
      } catch (err) {
        console.error('Failed to save completion date:', err.message);
      }
    }, 1000);
  }

  function handleStepStatusToggle(stepIndex) {
    const step = steps[stepIndex];
    const newStatus = step.status === 'completed' ? 'in_progress' : 'completed';
    setSteps((prev) =>
      prev.map((s, i) => (i === stepIndex ? { ...s, status: newStatus } : s))
    );
    immeditateSave(stepIndex, { status: newStatus });
  }

  function debouncedSave(stepIndex, updates) {
    const stepId = steps[stepIndex]?.id;
    if (!stepId) return;

    if (saveTimers.current[stepId]) {
      clearTimeout(saveTimers.current[stepId]);
    }

    saveTimers.current[stepId] = setTimeout(() => {
      performSave(stepIndex, updates);
    }, 1000);
  }

  function immeditateSave(stepIndex, updates) {
    performSave(stepIndex, updates);
  }

  async function performSave(stepIndex, updates) {
    const step = steps[stepIndex];
    if (!step) return;

    const payload = {
      userContent: updates.userContent !== undefined ? updates.userContent : step.userContent,
      completionDate: step.completionDate,
      status: updates.status || step.status || 'in_progress',
    };

    if (payload.status === 'pending' && payload.userContent) {
      payload.status = 'in_progress';
    }

    setSavingStep(step.id);
    try {
      await apiSaveStep(step.id, payload);
      setSavedIndicator(step.id);
      setTimeout(() => setSavedIndicator(null), 2000);
    } catch (err) {
      console.error('Save failed:', err.message);
    } finally {
      setSavingStep(null);
    }
  }

  const stepsComplete = steps.filter((s) => s.status === 'completed').length;

  // Render TipTap JSON nodes into React elements for the guide panel
  function renderTiptapNode(node, idx) {
    if (!node) return null;
    if (node.type === 'text') {
      let el = node.text || '';
      if (node.marks) {
        node.marks.forEach((m) => {
          if (m.type === 'bold') el = <strong key={idx}>{el}</strong>;
          if (m.type === 'italic') el = <em key={idx}>{el}</em>;
        });
      }
      return el;
    }
    const children = (node.content || []).map((c, i) => renderTiptapNode(c, i));
    switch (node.type) {
      case 'doc': return <div key={idx}>{children}</div>;
      case 'heading': {
        const Tag = `h${Math.min(node.attrs?.level || 3, 4)}`;
        return <Tag key={idx} className="guide-heading">{children}</Tag>;
      }
      case 'paragraph': return <p key={idx} className="guide-paragraph">{children}</p>;
      case 'bulletList': return <ul key={idx} className="guide-list">{children}</ul>;
      case 'orderedList': return <ol key={idx} className="guide-list">{children}</ol>;
      case 'listItem': return <li key={idx}>{children}</li>;
      case 'table': return <table key={idx} className="guide-table"><tbody>{children}</tbody></table>;
      case 'tableRow': return <tr key={idx}>{children}</tr>;
      case 'tableHeader': return <th key={idx}>{children}</th>;
      case 'tableCell': return <td key={idx}>{children}</td>;
      case 'placeholder':
        return <span key={idx} className="guide-placeholder">[{node.attrs?.label || node.attrs?.key || 'Field'}]</span>;
      case 'horizontalRule': return <hr key={idx} className="guide-hr" />;
      case 'hardBreak': return <br key={idx} />;
      default: return children.length ? <div key={idx}>{children}</div> : null;
    }
  }

  return (
    <div className="poc-editor">
      {/* Top bar */}
      <div className="poc-editor-topbar">
        <button className="btn btn-secondary" onClick={onBack}>
          {'\u2190'} Back to Dashboard
        </button>
        <div className="poc-editor-topbar-info">
          <span className="poc-editor-ftag">{deficiency.fTag}</span>
          <span className="poc-editor-step-count">{stepsComplete}/4 steps complete</span>
        </div>
        <div className="poc-editor-topbar-date">
          <label>Completion Date:</label>
          <input
            type="date"
            value={completionDate}
            onChange={(e) => handleCompletionDateChange(e.target.value)}
          />
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="poc-editor-layout">
        {/* Left panel wrapper: context + disclaimer */}
        <div className="poc-editor-left">
          <div className="poc-editor-context">
            {/* Tab bar */}
            <div className="context-tabs">
              <button
                className={`context-tab ${leftTab === 'deficiency' ? 'active' : ''}`}
                onClick={() => setLeftTab('deficiency')}
              >
                {'\uD83D\uDCCB'} Deficiency
              </button>
              <button
                className={`context-tab ${leftTab === 'guide' ? 'active' : ''}`}
                onClick={() => setLeftTab('guide')}
              >
                {'\uD83D\uDCDA'} F-Tag Guide
              </button>
            </div>

            {/* Tab content */}
            <div className="context-tab-content">
              {leftTab === 'deficiency' && (
                <div className="context-tab-panel">
                  {/* AI Summary card */}
                  {(deficiency.summary || (deficiency.keyPoints && deficiency.keyPoints.length > 0)) && (
                    <div className="ai-summary-card">
                      <div className="ai-summary-header">
                        <span className="ai-summary-icon">{'\u2728'}</span>
                        <h3>Deficiency Summary</h3>
                      </div>
                      {deficiency.summary && (
                        <p className="ai-summary-text">{deficiency.summary}</p>
                      )}
                      {deficiency.keyPoints && deficiency.keyPoints.length > 0 && (
                        <ul className="ai-summary-points">
                          {deficiency.keyPoints.map((point, i) => (
                            <li key={i}>{point}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}

                  <div className="context-panel">
                    <div
                      className="context-panel-header"
                      onClick={() => setShowNarrative(!showNarrative)}
                    >
                      <h3>Deficiency Narrative</h3>
                      <span className="context-toggle-icon">{showNarrative ? '\u25B2' : '\u25BC'}</span>
                    </div>
                    {showNarrative && (
                      <div className="context-panel-body">
                        {deficiency.severity && (
                          <div className="context-meta">
                            <span className="context-meta-badge">Severity: {deficiency.severity}</span>
                            {deficiency.scope && (
                              <span className="context-meta-badge">Scope: {deficiency.scope}</span>
                            )}
                          </div>
                        )}
                        <div className="narrative-text">
                          {deficiency.narrative || 'No narrative was extracted for this deficiency.'}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

            {leftTab === 'guide' && (
              <div className="context-tab-panel">
                {templateLoading && (
                  <div className="guide-loading">
                    <div className="spinner-sm" />
                    <span>Loading template...</span>
                  </div>
                )}

                {!templateLoading && !templateData && !deficiency.adminTemplateId && (
                  <div className="guide-empty">
                    <span className="guide-empty-icon">{'\uD83D\uDCDA'}</span>
                    <p>No F-Tag template is linked to this deficiency.</p>
                    <p className="guide-empty-hint">Templates provide step-specific guidance, key questions, and regulatory references to help you write your plan of correction.</p>
                  </div>
                )}

                {!templateLoading && !templateData && deficiency.adminTemplateId && (
                  <div className="guide-empty">
                    <span className="guide-empty-icon">{'\u26A0\uFE0F'}</span>
                    <p>Could not load the template. Make sure the Admin app is running.</p>
                  </div>
                )}

                {!templateLoading && templateData && (
                  <div className="guide-content">
                    <div className="guide-full-template">
                      <div className="guide-full-template-header">
                        {'\uD83D\uDCDA'} F-Tag Template Document
                      </div>
                      <div className="guide-rendered">
                        {renderTiptapNode(templateData, 0)}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          </div>

          {/* Disclaimer bubble below the context panel */}
          <div className="disclaimer-pill">
            {'\u2728'} AI suggestions are guidance only — review before use.
          </div>
        </div>

        {/* Right panel: stepper + active step */}
        <div className="poc-editor-form">
          {/* Horizontal stepper */}
          <div className="poc-stepper">
            {steps.map((step, idx) => (
              <React.Fragment key={step.id}>
                <button
                  className={`poc-stepper-step ${activeStepIndex === idx ? 'active' : ''} ${step.status === 'completed' ? 'completed' : ''}`}
                  onClick={() => setActiveStepIndex(idx)}
                >
                  <div className="poc-stepper-circle">
                    {step.status === 'completed' ? '\u2713' : STEP_ICONS[idx]}
                  </div>
                  <span className="poc-stepper-label">{STEP_SHORT_LABELS[idx]}</span>
                </button>
                {idx < steps.length - 1 && (
                  <div className={`poc-stepper-line ${step.status === 'completed' ? 'completed' : ''}`} />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Active step content */}
          {steps[activeStepIndex] && (() => {
            const step = steps[activeStepIndex];
            const idx = activeStepIndex;
            return (
              <div className={`poc-active-step ${step.status === 'completed' ? 'step-complete' : ''}`}>
                <div className="poc-active-step-header">
                  <div className="poc-active-step-title">
                    <span className="poc-step-number">Step {step.stepNumber}</span>
                    <span className="poc-step-name">{step.stepTitle}</span>
                  </div>
                  <div className="poc-step-actions">
                    {savingStep === step.id && (
                      <span className="save-indicator saving">Saving...</span>
                    )}
                    {savedIndicator === step.id && (
                      <span className="save-indicator saved">{'\u2713'} Saved</span>
                    )}
                    {generatingStep === idx ? (
                      <span className="save-indicator saving">{'\u2728'} Generating...</span>
                    ) : (
                      <>
                        <button
                          className="btn btn-primary btn-sm btn-generate-step"
                          onClick={() => handleGenerateStepDraft(idx)}
                        >
                          {'\u2728'} {step.aiSuggestion ? 'Regenerate' : 'AI Draft'}
                        </button>
                        <button
                          className="btn btn-secondary btn-sm btn-assist"
                          onClick={() => handleOpenAssist(idx)}
                        >
                          {'\uD83E\uDD16'} AI Assist
                        </button>
                      </>
                    )}
                    <label className="step-complete-toggle">
                      <input
                        type="checkbox"
                        checked={step.status === 'completed'}
                        onChange={() => handleStepStatusToggle(idx)}
                      />
                      <span>Complete</span>
                    </label>
                  </div>
                </div>

                {step.aiSuggestion && !step.userContent && (
                  <div className="ai-suggestion-banner">
                    <span className="ai-badge">{'\u2728'} AI Suggestion</span>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleStepContentChange(idx, step.aiSuggestion)}
                    >
                      Use as starting point
                    </button>
                  </div>
                )}

                {step.aiSuggestion && !step.userContent && (
                  <div className="ai-suggestion-preview">
                    {step.aiSuggestion}
                  </div>
                )}

                {/* Show regenerated suggestion when user already has content */}
                {regeneratedStep === idx && step.aiSuggestion && step.userContent && (
                  <div className="regenerated-toast-wrapper">
                    <div className="regenerated-toast">
                      <span className="regenerated-toast-sparkle">{'\u2728'}</span>
                      <span className="regenerated-toast-text">Use the new AI draft?</span>
                      <div className="regenerated-toast-actions">
                        <button
                          className="regenerated-toast-btn accept"
                          onClick={() => {
                            handleStepContentChange(idx, step.aiSuggestion);
                            setRegeneratedStep(null);
                          }}
                          title="Accept new suggestion"
                        >
                          {'\u2713'}
                        </button>
                        <button
                          className="regenerated-toast-btn dismiss"
                          onClick={() => setRegeneratedStep(null)}
                          title="Dismiss"
                        >
                          {'\u2715'}
                        </button>
                      </div>
                    </div>
                    <div className="regenerated-preview">
                      {step.aiSuggestion}
                    </div>
                  </div>
                )}

                <textarea
                  className="poc-step-textarea"
                  value={step.userContent || ''}
                  onChange={(e) => handleStepContentChange(idx, e.target.value)}
                  placeholder={
                    step.aiSuggestion
                      ? 'Click "Use as starting point" above, or write your own...'
                      : 'Write your plan of correction for this step...'
                  }
                  rows={8}
                />

                {/* Step navigation */}
                <div className="poc-step-nav">
                  {idx > 0 && (
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => setActiveStepIndex(idx - 1)}
                    >
                      {'\u2190'} Previous
                    </button>
                  )}
                  <div className="poc-step-nav-spacer" />
                  {idx < steps.length - 1 && (
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => setActiveStepIndex(idx + 1)}
                    >
                      Next {'\u2192'}
                    </button>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* AI Assist Modal */}
      {assistModalOpen && (
        <div className="assist-modal-overlay" onClick={() => !assistGenerating && setAssistModalOpen(false)}>
          <div className="assist-modal" onClick={(e) => e.stopPropagation()}>
            <div className="assist-modal-header">
              <div className="assist-modal-title">
                <span className="assist-modal-icon">{'\uD83E\uDD16'}</span>
                <div>
                  <h3>AI Assist</h3>
                  <p className="assist-modal-subtitle">
                    Step {steps[activeStepIndex]?.stepNumber}: {STEP_SHORT_LABELS[activeStepIndex]}
                  </p>
                </div>
              </div>
              <button
                className="assist-modal-close"
                onClick={() => !assistGenerating && setAssistModalOpen(false)}
                disabled={assistGenerating}
              >
                {'\u2715'}
              </button>
            </div>

            <div className="assist-modal-body">
              {assistLoading && (
                <div className="assist-modal-loading">
                  <div className="spinner-sm" />
                  <span>Generating questions for this step...</span>
                </div>
              )}

              {!assistLoading && assistQuestions && (
                <div className="assist-questions">
                  <p className="assist-instructions">
                    Answer these questions to help AI generate a tailored draft for this step. The more detail you provide, the better the result.
                  </p>
                  {assistQuestions.map((q) => (
                    <div key={q.id} className="assist-question-item">
                      <label className="assist-question-label">{q.question}</label>
                      {q.hint && <p className="assist-question-hint">{q.hint}</p>}
                      {q.type === 'textarea' ? (
                        <textarea
                          className="assist-question-input"
                          value={assistAnswers[q.id] || ''}
                          onChange={(e) =>
                            setAssistAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                          }
                          rows={3}
                          placeholder="Type your answer..."
                          disabled={assistGenerating}
                        />
                      ) : (
                        <input
                          type="text"
                          className="assist-question-input"
                          value={assistAnswers[q.id] || ''}
                          onChange={(e) =>
                            setAssistAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                          }
                          placeholder="Type your answer..."
                          disabled={assistGenerating}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="assist-modal-footer">
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setAssistModalOpen(false)}
                disabled={assistGenerating}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary btn-sm btn-assist-generate"
                onClick={handleAssistGenerate}
                disabled={assistLoading || assistGenerating || !assistQuestions}
              >
                {assistGenerating ? (
                  <>
                    <div className="spinner-sm spinner-white" />
                    Generating...
                  </>
                ) : (
                  <>{'\u2728'} Generate Draft</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
