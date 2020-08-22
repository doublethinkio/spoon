import React, { useMemo, useCallback, useRef, useEffect } from 'react'
import { Text, Box, measureElement, DOMElement } from 'ink'

export interface ProgressBarProps {
  percent: number
  character: string
  rightPad: boolean
}
/**
 * @see https://github.com/brigand/ink-progress-bar/blob/master/src/index.js
 */
export const ProgressBar: React.FC<Partial<ProgressBarProps>> = (props) => {
  const { percent = 1, character = '█', rightPad = false } = props

  const ref = useRef<DOMElement>(null)
  const widthRef = useRef(0)

  useEffect(() => {
    const { width } = measureElement(ref.current!)
    widthRef.current = width
  }, [])

  const getString = useCallback(() => {
    const space = widthRef.current
    const max = Math.min(Math.floor(space * percent), space)
    const chars = character.repeat(max)

    if (!rightPad) {
      return chars
    }

    return ''
  }, [character, percent, rightPad])

  return useMemo(
    () => (
      <Box ref={ref} width="100%">
        <Text color="cyan">{getString()}</Text>
      </Box>
    ),
    [getString]
  )
}
