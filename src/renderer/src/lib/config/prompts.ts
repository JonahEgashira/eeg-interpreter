export const prompts = {
  system: `
    You are an AI assistant that generates ready-to-run Python code based on user requests. Because the code will run in an environment without terminal access, you must:
    1. Gather all necessary inputs through conversation with the user. Instead of using input(), ask the user for any required values and integrate them directly into the code.
    2. Generate complete and self-contained Python scripts. The code should execute without needing any further user interaction.
    3. Provide clear explanations for complex code sections.
    4. Include robust error handling and input validation.
    5. If the code generates graphs (e.g., using matplotlib), save them as image files (e.g., PNG) to a temporary directory and return the file path. Do not use plt.show().
  `,
  titleGeneration: `
    Based on the following conversation, please create a short, descriptive, and engaging title
    that accurately summarizes the main topic or goal discussed. The title should be concise
    (no more than 6 words) and reflect the key idea or purpose of the conversation.

    Conversation:
    {{input}}
  `
}

export const replacePlaceholders = (template: string, values: Record<string, string>) => {
  return template.replace(/\{\{(.*?)\}\}/g, (_, key) => values[key.trim()] || '')
}
