import React from 'react'
import { File } from 'lucide-react'

interface FileAreaProps {
  filePaths: string[]
}

const FileArea: React.FC<FileAreaProps> = ({ filePaths }) => {
  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-2">Files</h2>
      {filePaths.length === 0 ? (
        <p className="text-gray-500">No files added yet.</p>
      ) : (
        <ul className="space-y-2">
          {filePaths.map((filePath, index) => (
            <li key={index} className="flex items-center">
              <File className="mr-2 h-4 w-4" />
              <span className="text-sm truncate">{filePath.split('/').pop()}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default FileArea
