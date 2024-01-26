// java script a akta in bild error clss a6a ar extends syntex use kora tar sob valus ami amar class a nita parbo

class apiError extends Error {
  constructor(
    statusCode,
    massage = "Somthing wants wrong",
    error = [],
    stack = ""
  ) {
    super(massage);
    this.statusCode = statusCode;
    this.massage = massage;
    this.data = null;
    this.error = error;
    this.success = false;
    //TODO:
    // ata bujta hob pora amy
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export { apiError };
