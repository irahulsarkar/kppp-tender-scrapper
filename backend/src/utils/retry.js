const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function withRetry(fn, options = {}) {
  const {
    attempts = 3,
    baseDelayMs = 1000,
    factor = 2,
    onRetry = () => {}
  } = options;

  let lastError;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await fn(attempt);
    } catch (error) {
      lastError = error;

      if (attempt >= attempts) {
        break;
      }

      onRetry(error, attempt);
      await delay(baseDelayMs * factor ** (attempt - 1));
    }
  }

  throw lastError;
}
