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

export async function login(email: string, password: string): Promise<void> {
  let token: string;
  if (DEV) {
    token = "dev-admin";
  } else {
    const region = import.meta.env.VITE_COGNITO_REGION as string;
    const res = await fetch(`https://cognito-idp.${region}.amazonaws.com/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-amz-json-1.1",
        "X-Amz-Target": "AWSCognitoIdentityProviderService.InitiateAuth",
      },
      body: JSON.stringify({
        AuthFlow: "USER_PASSWORD_AUTH",
        ClientId: import.meta.env.VITE_COGNITO_CLIENT_ID,
        AuthParameters: { USERNAME: email, PASSWORD: password },
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.AuthenticationResult) throw new Error("Email hoặc mật khẩu không đúng");
    token = data.AuthenticationResult.IdToken;
  }
  try {
    localStorage.setItem(KEY, token);
  } catch {
    throw new Error("Trình duyệt chặn lưu phiên đăng nhập");
  }
}
