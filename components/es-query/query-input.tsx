'use client';

import { useState, useCallback } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { json } from '@codemirror/lang-json';
import { oneDark } from '@codemirror/theme-one-dark';
import { Check, Copy, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ParseResult } from '@/lib/core/es-query';
import { cn } from '@/lib/utils';

interface QueryInputProps {
  value: string;
  onChange: (value: string) => void;
  parseResult: ParseResult | null;
}

export function QueryInput({ value, onChange, parseResult }: QueryInputProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [value]);

  const handleFormat = useCallback(() => {
    try {
      const parsed = JSON.parse(value);
      const formatted = JSON.stringify(parsed, null, 2);
      onChange(formatted);
    } catch {
      // Don't format if invalid JSON
    }
  }, [value, onChange]);

  const handleEditorChange = useCallback(
    (val: string) => {
      onChange(val);
    },
    [onChange]
  );

  const isValid = parseResult?.success ?? false;
  const errorMessage = parseResult?.error;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <span className="text-sm font-medium text-muted-foreground">
          Query Input
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleFormat}
            className="h-8 px-3 text-xs"
          >
            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
            Format
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="h-8 px-3 text-xs"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 mr-1.5 text-green-500" />
                <span className="text-green-500">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 mr-1.5" />
                Copy
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-auto">
        <CodeMirror
          value={value}
          onChange={handleEditorChange}
          extensions={[json()]}
          theme={oneDark}
          className="h-full text-sm"
          basicSetup={{
            lineNumbers: true,
            foldGutter: true,
            highlightActiveLine: true,
            highlightSelectionMatches: true,
            autocompletion: true,
          }}
        />
      </div>

      {/* Status bar */}
      <div
        className={cn(
          'flex items-center gap-2 px-4 py-2 border-t text-xs',
          isValid
            ? 'border-green-500/20 bg-green-500/5'
            : 'border-red-500/20 bg-red-500/5'
        )}
      >
        {isValid ? (
          <>
            <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
            <span className="text-green-500">Valid ES Query</span>
          </>
        ) : (
          <>
            <AlertCircle className="w-3.5 h-3.5 text-red-500" />
            <span className="text-red-500 truncate">
              {errorMessage || 'Invalid query'}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
