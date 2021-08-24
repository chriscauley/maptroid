export default ({ ...item }, getNextId) => {
  if (!item.id) {
    item.id = getNextId()
  }
  return item
}
