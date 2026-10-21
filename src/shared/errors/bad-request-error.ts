export class BadRequestError extends Error {
  constructor(msg: string) {
    super(msg)
    this.name = 'BadRequestError'
  }
}
