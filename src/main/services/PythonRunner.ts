import { execFile } from 'child_process'
import { writeFile, unlink } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'

export async function runPythonCode(code: string): Promise<string> {
  const tmpFilePath = join(tmpdir(), `temp_script_${Date.now()}.py`)

  try {
    await writeFile(tmpFilePath, code)
    console.log(`File created at ${tmpFilePath}`)

    const result = await new Promise<string>((resolve, reject) => {
      execFile('python', [tmpFilePath], (error, stdout, stderr) => {
        if (error) {
          reject(`Error: ${stderr}`)
        } else {
          resolve(stdout)
        }
      })
    })

    return result
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Failed to write or execute the script: ${error.message}`)
    } else {
      console.error(`Failed to write or execute the script: ${error}`)
    }
    throw error
  } finally {
    try {
      await unlink(tmpFilePath)
      console.log(`File deleted at ${tmpFilePath}`)
    } catch (unlinkError) {
      if (unlinkError instanceof Error) {
        console.error(`Failed to delete the script file: ${unlinkError.message}`)
      } else {
        console.error(`Failed to delete the script file: ${unlinkError}`)
      }
    }
  }
}
