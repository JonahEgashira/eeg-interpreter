import * as React from 'react'
import { useState, useRef } from 'react'
import { Button } from './components/ui/Button'
import { Textarea } from './components/ui/Textarea'
import { Tooltip, TooltipTrigger } from './components/ui/Tooltip'
import { IconArrowElbow } from './components/ui/Icons'

function App(): JSX.Element {
  const [input, setInput] = useState<string>('')
  const inputRef = useRef<HTMLTextAreaElement | null>(null)

  const onKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>): void => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleSubmit()
    }
  }

  const handleSubmit = (): void => {
    if (input.trim() === '') return
    console.log('Message sent:', input)
    setInput('')
  }

  return (
    <div className="relative">
      <Textarea
        ref={inputRef}
        tabIndex={0}
        onKeyDown={onKeyDown}
        placeholder="Send a message."
        className="min-h-[60px] w-full resize-none bg-transparent px-4 py-[1.3rem] focus-within:outline-none sm:text-sm"
        autoFocus
        spellCheck={false}
        autoComplete="off"
        autoCorrect="off"
        name="message"
        rows={1}
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />
      <div className="absolute right-0 top-[13px] sm:right-4">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button type="submit" size="icon" disabled={input === ''} onClick={handleSubmit}>
              <IconArrowElbow />
              <span className="sr-only">Send message</span>
            </Button>
          </TooltipTrigger>
          <div className="tooltip-content">Send</div>
        </Tooltip>
      </div>
    </div>
  )
}

export default App
