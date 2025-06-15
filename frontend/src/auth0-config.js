export const auth0Config = {
    domain: "dev-31su72tgkfym01db.us.auth0.com", // e.g., "dev-xxx.us.auth0.com"
    clientId: "xt4U3w9md4ZHt8JVcaJZCYyGjrs2zLfz",
    authorizationParams: {
        redirect_uri: window.location.origin,
        audience: "https://dev-31su72tgkfym01db.us.auth0.com/api/v2/", // Optional: if you have an API
        scope: "openid profile email"
    }
}; 