import FileSaver from 'file-saver'

export default (content, name) => {
  const blob = new Blob([JSON.stringify(content, null, 2)], { type: 'text/plain;charset=utf-8' })
  FileSaver.saveAs(blob, name)
}
