import { memo } from 'react'
import { Download } from 'lucide-react'

const ImageDisplay = memo(({ messageIndex, base64 }: { messageIndex: number; base64: string }) => (
  <div className="flex flex-col items-start mb-2">
    <a
      href={`data:image/png;base64,${base64}`}
      download={`${Date.now()}-${messageIndex}.png`}
      className="my-2 self-end p-1 text-black underline flex items-center"
    >
      <Download size={20} />
    </a>
    <img src={`data:image/png;base64,${base64}`} alt="figure" className="max-w-full" />
  </div>
))
ImageDisplay.displayName = 'ImageDisplay'

export default ImageDisplay
