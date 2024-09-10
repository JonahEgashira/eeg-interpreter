import * as path from 'path'
import * as fs from 'fs/promises'

export async function handleFigureData(
  base64Data: string,
  outputDir: string
): Promise<{ figurePath: string }> {
  const figureName = `${Date.now()}.txt` // as base64
  const figurePath = path.join(outputDir, figureName)

  try {
    await fs.writeFile(figurePath, base64Data, 'utf-8')
    return { figurePath }
  } catch (error) {
    console.error('Error saving figure:', error)
    throw error
  }
}

export async function loadBase64Data(figurePath: string): Promise<string | null> {
  try {
    const base64Data = await fs.readFile(figurePath, 'utf-8')
    return base64Data
  } catch (error) {
    console.error('Error loading base64 data:', error)
    return null
  }
}
