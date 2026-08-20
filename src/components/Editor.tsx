import CodeMirror from '@uiw/react-codemirror';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { useVaultStore } from '../store/vaultStore';
import { useAutoSave } from '../hooks/useAutoSave';

export default function Editor() {
  const currentPath = useVaultStore((s) => s.currentPath);
  const content = useVaultStore((s) => s.content);
  const setContent = useVaultStore((s) => s.setContent);
  useAutoSave();

  if (!currentPath) return <div className="empty">从左侧选择或新建一篇笔记</div>;

  return (
    <div className="editor">
      <CodeMirror
        value={content}
        onChange={(value) => setContent(value)}
        height="100%"
        extensions={[markdown({ base: markdownLanguage })]}
        basicSetup={{ lineNumbers: true, highlightActiveLine: true }}
      />
    </div>
  );
}