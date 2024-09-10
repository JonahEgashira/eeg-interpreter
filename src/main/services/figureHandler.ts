import * as path from 'path'
import * as fs from 'fs/promises'

export async function handleFigureData(
  base64Data: string,
  outputDir: string
): Promise<{ figurePath: string }> {
  const figureBuffer = Buffer.from(base64Data, 'base64')
  const figureName = `${Date.now()}.png`
  const figurePath = path.join(outputDir, figureName)

  try {
    await fs.writeFile(figurePath, figureBuffer)
    return { figurePath }
  } catch (error) {
    console.error('Error saving figure:', error)
    throw error
  }
}
