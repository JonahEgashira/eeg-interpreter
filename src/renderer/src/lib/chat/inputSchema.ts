import { z } from 'zod'

export const InputSchema = z.object({
  input: z.string().min(1, 'Input must not be empty')
})
