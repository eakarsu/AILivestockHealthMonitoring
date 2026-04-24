import React from 'react';

function AIResultDisplay({ result, onClose }) {
  if (!result) return null;

  const parseContent = (content) => {
    if (!content) return [];
    const lines = content.split('\n');
    const sections = [];
    let currentSection = null;

    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed) return;

      // Detect section headers (lines starting with ## or ** or all caps or ending with :)
      if (trimmed.startsWith('## ') || trimmed.startsWith('### ')) {
        if (currentSection) sections.push(currentSection);
        currentSection = { title: trimmed.replace(/^#+\s*/, '').replace(/\*\*/g, ''), items: [] };
      } else if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
        if (currentSection) sections.push(currentSection);
        currentSection = { title: trimmed.replace(/\*\*/g, ''), items: [] };
      } else if (/^[A-Z][A-Z\s&]{3,}:?$/.test(trimmed) || (trimmed.endsWith(':') && trimmed.length < 50 && !trimmed.startsWith('-') && !trimmed.startsWith('*'))) {
        if (currentSection) sections.push(currentSection);
        currentSection = { title: trimmed.replace(/:$/, ''), items: [] };
      } else {
        if (!currentSection) currentSection = { title: 'Analysis', items: [] };
        currentSection.items.push(trimmed);
      }
    });
    if (currentSection) sections.push(currentSection);
    return sections;
  };

  const formatItem = (item) => {
    // Remove bullet points and format
    let text = item.replace(/^[-*•]\s*/, '').replace(/^\d+\.\s*/, '');

    // Format bold text
    const parts = [];
    const boldRegex = /\*\*(.*?)\*\*/g;
    let lastIndex = 0;
    let match;

    while ((match = boldRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(<span key={lastIndex}>{text.slice(lastIndex, match.index)}</span>);
      }
      parts.push(<strong key={match.index}>{match[1]}</strong>);
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < text.length) {
      parts.push(<span key={lastIndex}>{text.slice(lastIndex)}</span>);
    }
    return parts.length > 0 ? parts : text;
  };

  const getSeverityIcon = (title) => {
    const t = title.toLowerCase();
    if (t.includes('critical') || t.includes('urgent') || t.includes('risk') || t.includes('warning')) return '⚠️';
    if (t.includes('recommend') || t.includes('action') || t.includes('treatment')) return '💡';
    if (t.includes('summary') || t.includes('overview') || t.includes('analysis')) return '📊';
    if (t.includes('prevention') || t.includes('prevention')) return '🛡️';
    if (t.includes('financial') || t.includes('cost') || t.includes('revenue') || t.includes('roi')) return '💰';
    if (t.includes('disease') || t.includes('diagnosis')) return '🔬';
    if (t.includes('test') || t.includes('exam')) return '🧪';
    if (t.includes('diet') || t.includes('feed') || t.includes('nutrition')) return '🌾';
    if (t.includes('breeding') || t.includes('genetic')) return '🧬';
    if (t.includes('production') || t.includes('milk') || t.includes('yield')) return '🥛';
    return '📋';
  };

  const sections = parseContent(result.content);

  return (
    <div className="ai-result-container">
      <div className="ai-result-header">
        <div className="ai-result-title">
          <span className="ai-badge">AI</span>
          <h3>AI Analysis Result</h3>
        </div>
        {onClose && <button className="btn-close-sm" onClick={onClose}>×</button>}
      </div>

      {result.error ? (
        <div className="ai-error">{result.content}</div>
      ) : (
        <div className="ai-result-body">
          {sections.map((section, idx) => (
            <div key={idx} className="ai-section-card">
              <div className="ai-section-header">
                <span className="section-icon">{getSeverityIcon(section.title)}</span>
                <h4>{section.title}</h4>
              </div>
              <div className="ai-section-content">
                {section.items.map((item, i) => (
                  <div key={i} className={`ai-item ${item.startsWith('-') || item.startsWith('*') || item.startsWith('•') || /^\d+\./.test(item) ? 'bullet-item' : ''}`}>
                    {item.startsWith('-') || item.startsWith('*') || item.startsWith('•') || /^\d+\./.test(item) ? (
                      <><span className="bullet">•</span><span>{formatItem(item)}</span></>
                    ) : (
                      <span>{formatItem(item)}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {result.model && (
            <div className="ai-meta">
              <span>Model: {result.model}</span>
              {result.usage && <span>Tokens: {result.usage.total_tokens}</span>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AIResultDisplay;
