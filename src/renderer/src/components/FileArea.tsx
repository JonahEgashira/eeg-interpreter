import React from 'react'
import { File } from 'lucide-react'

interface FileAreaProps {
  filePaths: string[]
}

const FileArea: React.FC<FileAreaProps> = ({ filePaths }) => {
  return (
    <div className="w-64 bg-gray-100 text-gray-800 p-4 flex flex-col border-r border-gray-300">
      <h2 className="text-lg font-semibold mb-2">Files</h2>
      {filePaths.length === 0 ? (
        <p className="text-gray-500">No files added yet.</p>
      ) : (
        <ul className="space-y-2 flex-grow overflow-auto">
          {filePaths.map((filePath, index) => (
            <li
              key={index}
              className="flex items-center p-2 mb-2 rounded cursor-pointer transition-colors duration-200 hover:bg-gray-200 text-gray-700"
            >
              <File className="mr-2 h-4 w-4" />
              <span className="text-sm truncate" title={filePath}>
                {filePath.split('/').pop()}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default FileArea
