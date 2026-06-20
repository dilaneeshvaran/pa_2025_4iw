import { Prisma } from '@prisma/client'

//prevent leaking database or internal server details to endusers
export function sanitizeErrorMessage(error: unknown, fallbackMessage: string): string {
  if (!error) {
    return fallbackMessage
  }

  // check if it is a prisma client error
  if (
    error instanceof Prisma.PrismaClientKnownRequestError ||
    error instanceof Prisma.PrismaClientUnknownRequestError ||
    error instanceof Prisma.PrismaClientRustPanicError ||
    error instanceof Prisma.PrismaClientInitializationError ||
    error instanceof Prisma.PrismaClientValidationError ||
    (error.constructor && error.constructor.name.startsWith('PrismaClient'))
  ) {
    return fallbackMessage
  }

  if (error instanceof Error) {
    const msg = error.message

    // check for database/prisma keywords in generic error messages
    if (
      msg.includes('prisma') ||
      msg.includes('PrismaClient') ||
      msg.includes('database') ||
      msg.includes('foreign key') ||
      msg.includes('unique constraint') ||
      msg.includes('relation "') ||
      msg.includes('table "') ||
      msg.includes('connection') ||
      msg.includes('connect') ||
      msg.includes('findFirst') ||
      msg.includes('findUnique') ||
      msg.includes('findMany') ||
      msg.includes('create') ||
      msg.includes('update') ||
      msg.includes('delete')
    ) {
      return fallbackMessage
    }

    // check if it's a native js runtime crash error
    if (
      error instanceof TypeError ||
      error instanceof ReferenceError ||
      error instanceof SyntaxError ||
      error instanceof RangeError ||
      error instanceof URIError
    ) {
      return fallbackMessage
    }

    //check for system / network errors 
    const errWithCode = error as { code?: string }
    if (errWithCode.code && typeof errWithCode.code === 'string') {
      const code = errWithCode.code
      if (
        code.startsWith('ERR_') ||
        code === 'ECONNREFUSED' ||
        code === 'ENOENT' ||
        code === 'EACCES' ||
        code === 'ENOTFOUND'
      ) {
        return fallbackMessage
      }
    }

    return msg
  }

  if (typeof error === 'string') {
    return error
  }

  return fallbackMessage
}
