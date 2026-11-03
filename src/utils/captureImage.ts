import html2canvas from 'html2canvas'

export async function captureAsImage(elementId: string, filename: string): Promise<void> {
  const el = document.getElementById(elementId)
  if (!el) throw new Error('Element not found')
  const canvas = await html2canvas(el, {
    backgroundColor: '#FFF8F0',
    scale: 2,
    useCORS: true,
    logging: false,
  })
  canvas.toBlob((blob) => {
    if (!blob) return
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${filename}.png`
    a.click()
    URL.revokeObjectURL(url)
  }, 'image/png')
}
