'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Toggle } from '@/components/ui/toggle';
import { Separator } from '@/components/ui/separator';
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Heading1,
  Heading2,
  Quote,
  Undo,
  Redo,
} from 'lucide-react';

interface EditorProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  minHeight?: string;
}

const Editor = React.forwardRef<HTMLDivElement, EditorProps>(
  ({ value, onChange, placeholder, disabled, className, minHeight = '200px' }, ref) => {
    const editorRef = React.useRef<HTMLDivElement>(null);
    const [isEmpty, setIsEmpty] = React.useState(!value);

    React.useEffect(() => {
      if (editorRef.current && value !== undefined && editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value;
        setIsEmpty(!value || value === '<br>' || value === '');
      }
    }, [value]);

    const handleInput = () => {
      if (editorRef.current) {
        const content = editorRef.current.innerHTML;
        const textContent = editorRef.current.textContent || '';
        setIsEmpty(!textContent.trim());
        onChange?.(content);
      }
    };

    const execCommand = (command: string, value?: string) => {
      document.execCommand(command, false, value);
      editorRef.current?.focus();
      handleInput();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        execCommand('insertHTML', '&emsp;');
      }
    };

    return (
      <div
        className={cn(
          'rounded-md border border-input bg-background',
          disabled && 'opacity-50 cursor-not-allowed',
          className
        )}
      >
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-0.5 border-b bg-muted/30 p-1">
          <Toggle
            size="sm"
            pressed={false}
            onPressedChange={() => execCommand('bold')}
            disabled={disabled}
            aria-label="Bold"
          >
            <Bold className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={false}
            onPressedChange={() => execCommand('italic')}
            disabled={disabled}
            aria-label="Italic"
          >
            <Italic className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={false}
            onPressedChange={() => execCommand('underline')}
            disabled={disabled}
            aria-label="Underline"
          >
            <Underline className="h-4 w-4" />
          </Toggle>

          <Separator orientation="vertical" className="mx-1 h-6" />

          <Toggle
            size="sm"
            pressed={false}
            onPressedChange={() => execCommand('formatBlock', 'h1')}
            disabled={disabled}
            aria-label="Heading 1"
          >
            <Heading1 className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={false}
            onPressedChange={() => execCommand('formatBlock', 'h2')}
            disabled={disabled}
            aria-label="Heading 2"
          >
            <Heading2 className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={false}
            onPressedChange={() => execCommand('formatBlock', 'blockquote')}
            disabled={disabled}
            aria-label="Quote"
          >
            <Quote className="h-4 w-4" />
          </Toggle>

          <Separator orientation="vertical" className="mx-1 h-6" />

          <Toggle
            size="sm"
            pressed={false}
            onPressedChange={() => execCommand('insertUnorderedList')}
            disabled={disabled}
            aria-label="Bullet List"
          >
            <List className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={false}
            onPressedChange={() => execCommand('insertOrderedList')}
            disabled={disabled}
            aria-label="Numbered List"
          >
            <ListOrdered className="h-4 w-4" />
          </Toggle>

          <Separator orientation="vertical" className="mx-1 h-6" />

          <Toggle
            size="sm"
            pressed={false}
            onPressedChange={() => execCommand('justifyLeft')}
            disabled={disabled}
            aria-label="Align Left"
          >
            <AlignLeft className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={false}
            onPressedChange={() => execCommand('justifyCenter')}
            disabled={disabled}
            aria-label="Align Center"
          >
            <AlignCenter className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={false}
            onPressedChange={() => execCommand('justifyRight')}
            disabled={disabled}
            aria-label="Align Right"
          >
            <AlignRight className="h-4 w-4" />
          </Toggle>

          <Separator orientation="vertical" className="mx-1 h-6" />

          <Toggle
            size="sm"
            pressed={false}
            onPressedChange={() => execCommand('undo')}
            disabled={disabled}
            aria-label="Undo"
          >
            <Undo className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={false}
            onPressedChange={() => execCommand('redo')}
            disabled={disabled}
            aria-label="Redo"
          >
            <Redo className="h-4 w-4" />
          </Toggle>
        </div>

        {/* Editor Content */}
        <div className="relative">
          <div
            ref={editorRef}
            contentEditable={!disabled}
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            className={cn(
              'prose prose-sm dark:prose-invert max-w-none p-3 outline-none',
              'focus:ring-0 overflow-auto',
              '[&_h1]:text-xl [&_h1]:font-bold [&_h1]:mt-4 [&_h1]:mb-2',
              '[&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mt-3 [&_h2]:mb-2',
              '[&_blockquote]:border-l-4 [&_blockquote]:border-muted-foreground/30 [&_blockquote]:pl-4 [&_blockquote]:italic',
              '[&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6',
              disabled && 'cursor-not-allowed'
            )}
            style={{ minHeight }}
            suppressContentEditableWarning
          />
          {isEmpty && placeholder && (
            <div
              className="pointer-events-none absolute left-3 top-3 text-muted-foreground"
              aria-hidden
            >
              {placeholder}
            </div>
          )}
        </div>
      </div>
    );
  }
);

Editor.displayName = 'Editor';

export { Editor };

