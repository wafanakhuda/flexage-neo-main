"use client"

import { useEffect, useRef } from "react"
// Import pell with its type definitions
import pell from "pell"

interface PellEditorProps {
  id: string
  value: string
  onChange: (content: string) => void
}

export default function PellEditor({ id, value, onChange }: PellEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const initialized = useRef(false)

  useEffect(() => {
    if (typeof window === "undefined" || !editorRef.current || initialized.current) return

    // Initialize Pell editor directly
    const initEditor = () => {
      if (initialized.current || !editorRef.current) return

      // Helper function to ensure editor has focus before executing commands
      const executeCommand = (command: string, value?: string) => {
        const contentElement = editorRef.current?.querySelector('.pell-content') as HTMLElement
        if (contentElement) {
          // Ensure editor has focus
          contentElement.focus()
          
          // For heading commands, clear existing paragraph formatting first
          if (command === 'formatBlock') {
            // Remove existing block formatting
            document.execCommand('formatBlock', false, '<p>')
          }
          
          // Execute the command
          document.execCommand(command, false, value)
          
          // Make sure content change is recognized
          contentElement.dispatchEvent(new Event('input', { bubbles: true }))
        }
      }

      const editor = pell.init({
        // Ensure editorRef.current is not null (we've already checked above)
        element: editorRef.current as HTMLDivElement,
        onChange: (html: string) => {
          console.log("Editor HTML changed:", html); // Debug log
          onChange(html);
        },
        defaultParagraphSeparator: "p",
        styleWithCSS: false, // Set to false to use consistent HTML tags
        actions: [
          {
            name: 'bold',
            icon: 'B',
            title: 'Bold',
            result: () => executeCommand('bold') // Ensure consistent bold command
          },
          "italic",
          "underline",
          "strikethrough",
          {
            name: 'heading1',
            icon: '<b>H<sub>1</sub></b>',
            title: 'Heading 1',
            result: () => executeCommand('formatBlock', '<h1>')
          },
          {
            name: 'heading2',
            icon: '<b>H<sub>2</sub></b>',
            title: 'Heading 2',
            result: () => executeCommand('formatBlock', '<h2>')
          },
          {
            name: 'paragraph',
            icon: '¶',
            title: 'Paragraph',
            result: () => executeCommand('formatBlock', '<p>')
          },
          {
            name: 'quote',
            icon: '"',
            title: 'Quote',
            result: () => executeCommand('formatBlock', '<blockquote>')
          },
          {
            name: 'olist',
            icon: '1.',
            title: 'Ordered List',
            result: () => executeCommand('insertOrderedList')
          },
          {
            name: 'ulist',
            icon: '•',
            title: 'Unordered List',
            result: () => executeCommand('insertUnorderedList')
          },
          {
            name: 'code',
            icon: 'C',
            title: 'Code',
            result: () => executeCommand('formatBlock', '<pre>')
          },
          {
            name: 'line',
            icon: '—',
            title: 'Horizontal Line',
            result: () => executeCommand('insertHorizontalRule')
          },
          {
            name: 'link',
            icon: '🔗',
            title: 'Link',
            result: () => {
              const url = prompt('Enter the link URL:')
              if (url) {
                executeCommand('createLink', url)
              }
            }
          },
          {
            name: 'image',
            icon: '🖼️',
            title: 'Image',
            result: () => {
              const url = prompt('Enter the image URL:')
              if (url) {
                executeCommand('insertImage', url)
              }
            }
          },
        ],
        classes: {
          actionbar: "pell-actionbar",
          button: "pell-button",
          content: "pell-content",
          selected: "pell-button-selected",
        },
      });

      // Set initial content if provided
      if (value) {
        editor.content.innerHTML = value
      }

      initialized.current = true
    }

    // Initialize editor immediately
    initEditor()

    return () => {
      // Cleanup if needed
    }
  }, [onChange, value])

  // Update content when value prop changes
  useEffect(() => {
    if (editorRef.current && initialized.current && editorRef.current.querySelector(".pell-content")) {
      const contentElement = editorRef.current.querySelector(".pell-content") as HTMLElement
      if (contentElement && contentElement.innerHTML !== value) {
        contentElement.innerHTML = value
      }
    }
  }, [value])

  return (
    <>
      <style jsx global>{`
        .pell {
          border: 1px solid black;
          box-sizing: border-box;
        }
        .pell-content {
          border: 1px solid #E5E7EB;
          box-sizing: border-box;
          outline: 0;
          min-height: 200px;
          max-height: 600px;
          overflow-y: auto;
          padding: 10px;
          border-bottom-left-radius: 5px;
          border-bottom-right-radius: 5px;
        }
        .pell-actionbar {
          background-color: #f1f2f6;
          border-bottom: 1px solid #E5E7EB;
          border-radius: 5px 5px 0 0;
          display: flex;
          flex-wrap: wrap;
          padding: 5px;
        }
        .pell-button {
          background-color: transparent;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          height: 30px;
          margin: 2px;
          outline: 0;
          width: 30px;
        }
        .pell-button:hover {
          background-color: #E5E7EB;
        }
        .pell-button-selected {
          background-color: #E5E7EB;
        }
        
        /* Add some styles to make headings more visible in editor */
        .pell-content h1 {
          font-size: 1.5em;
          font-weight: bold;
          margin-top: 0.5em;
          margin-bottom: 0.5em;
        }
        
        .pell-content h2 {
          font-size: 1.25em;
          font-weight: bold;
          margin-top: 0.5em;
          margin-bottom: 0.5em;
        }
        
        /* Add styles for other formatting elements */
        .pell-content blockquote {
          border-left: 3px solid #ccc;
          margin-left: 5px;
          padding-left: 15px;
          color: #666;
          font-style: italic;
        }
        
        .pell-content ul {
          list-style-type: disc;
          margin-left: 20px;
        }
        
        .pell-content ol {
          list-style-type: decimal;
          margin-left: 20px;
        }
        
        .pell-content pre {
          background-color: #f4f4f4;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-family: monospace;
          padding: 10px;
          white-space: pre-wrap;
        }
        
        /* Styles for link and image */
        .pell-content a {
          color: #0066cc;
          text-decoration: underline;
        }
        
        .pell-content img {
          max-width: 100%;
          height: auto;
          margin: 0.5em 0;
        }
      `}</style>
      <div id={id} ref={editorRef} className="pell-container"></div>
    </>
  )
}

