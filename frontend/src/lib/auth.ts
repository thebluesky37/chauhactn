// Đăng nhập Admin. Local (VITE_DEV_AUTH=true): token cố định. AWS: Cognito USER_PASSWORD_AUTH.
const KEY = "pm_admin_token";
const DEV = import.meta.env.VITE_DEV_AUTH === "true";

export function getToken(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function logout() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* bỏ qua */
  }
}

function save(token: string) {
  try {
    localStorage.setItem(KEY, token);
  } catch {
    throw new Error("Trình duyệt chặn lưu phiên đăng nhập");
  }
}

async function cognito(target: string, body: unknown) {
  const region = import.meta.env.VITE_COGNITO_REGION as string;
  const res = await fetch(`https://cognito-idp.${region}.amazonaws.com/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-amz-json-1.1",
      "X-Amz-Target": `AWSCognitoIdentityProviderService.${target}`,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return { ok: res.ok, data };
}

export type LoginResult = { newPasswordSession?: string };

// Trả về newPasswordSession khi Cognito yêu cầu đặt mật khẩu mới (lần đăng nhập đầu với mật khẩu tạm).
export async function login(email: string, password: string): Promise<LoginResult> {
  if (DEV) {
    save("dev-admin");
    return {};
  }
  const { ok, data } = await cognito("InitiateAuth", {
    AuthFlow: "USER_PASSWORD_AUTH",
    ClientId: import.meta.env.VITE_COGNITO_CLIENT_ID,
    AuthParameters: { USERNAME: email, PASSWORD: password },
  });
  if (ok && data.ChallengeName === "NEW_PASSWORD_REQUIRED") return { newPasswordSession: data.Session };
  if (!ok || !data.AuthenticationResult) throw new Error("Email hoặc mật khẩu không đúng");
  save(data.AuthenticationResult.IdToken);
  return {};
}

export async function setNewPassword(email: string, newPassword: string, session: string): Promise<void> {
  const { ok, data } = await cognito("RespondToAuthChallenge", {
    ChallengeName: "NEW_PASSWORD_REQUIRED",
    ClientId: import.meta.env.VITE_COGNITO_CLIENT_ID,
    Session: session,
    ChallengeResponses: { USERNAME: email, NEW_PASSWORD: newPassword },
  });
  if (!ok || !data.AuthenticationResult) {
    throw new Error(data?.message || "Không đặt được mật khẩu mới (cần tối thiểu 12 ký tự, có chữ hoa, chữ thường và số)");
  }
  save(data.AuthenticationResult.IdToken);
}
