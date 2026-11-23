class SessionRequestError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export async function request(path, options = {}) {
  const response = await fetch(`/api/admin/${path}`, {
    credentials: "same-origin",
    cache: "no-store",
    ...options,
  });
  if (!response.ok) {
    let detail;
    if (response.headers.get("content-type")?.includes("application/problem+json")) {
      const problem = await response.json().catch(() => null);
      detail = typeof problem?.detail === "string" ? problem.detail : undefined;
    }
    throw new SessionRequestError(response.status, detail ?? "Não foi possível concluir a solicitação ao painel.");
  }
  return response;
}

export async function currentSession(signal) {
  try {
    const response = await request("session", { signal });
    const session = await response.json();
    if (typeof session.email !== "string" || !session.email) throw new Error("O servidor retornou dados incompletos da sessão.");
    return session;
  } catch (error) {
    if (error.status === 401) return null;
    throw error;
  }
}

export async function writeWithCsrf(path, method, { body, headers, signal } = {}) {
  const response = await request("csrf", { signal });
  const { headerName, token } = await response.json();
  if (typeof headerName !== "string" || !headerName || typeof token !== "string" || !token) {
    throw new Error("O servidor retornou dados incompletos de verificação.");
  }
  return request(path, { method, headers: { ...headers, [headerName]: token }, body, signal });
}

export async function signIn(email, password) {
  try {
    await writeWithCsrf("login", "POST", { body: new URLSearchParams({ email, password }) });
  } catch (error) {
    const options = { cause: error };
    if (error.status === 401) throw new Error("E-mail ou senha incorretos.", options);
    if (error.status === 429) throw new Error("Muitas tentativas de entrar. Aguarde um minuto e tente novamente.", options);
    if (error.status === 403) throw new Error("Não foi possível verificar a solicitação de acesso. Tente novamente.", options);
    throw new Error("Não foi possível acessar o painel. Confira se o servidor está funcionando.", options);
  }
  const session = await currentSession().catch(error => {
    throw new Error("Não foi possível confirmar a sessão. Confira se o servidor está funcionando e recarregue a página.", { cause: error });
  });
  if (!session) throw new Error("O navegador não conseguiu manter a sessão. Confira as configurações de cookies e tente novamente.");
  return session;
}

export function signOut() {
  return writeWithCsrf("logout", "POST");
}
