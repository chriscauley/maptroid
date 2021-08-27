export default class BaseModel {
  constructor(options, _schema) {
    this.options = options
    this._schema = _schema
    this._attrs = Object.keys(this._schema.properties)
    this._attrs.push('id')
    this._attrs.forEach((attr) => {
      this[attr] = options[attr]
    })
  }
  toJson() {
    return Object.fromEntries(this._attrs.map((attr) => [attr, this[attr]]))
  }
}
