export function runOnce<T, A extends any[]>(task: (...args: A) => Promise<T>): (...args: A) => Promise<T> {
  let promise: Promise<T> | null = null

  return function runOnceImpl(...args: A): Promise<T> {
    if (promise) {
      return promise
    }

    promise = task(...args)
      .then((result) => {
        promise = null
        return result
      })
      .catch((error) => {
        promise = null
        throw error
      })

    return promise
  }
}
