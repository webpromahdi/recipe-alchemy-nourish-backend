/**
 * Environment Variable Validation
 * Validates all required environment variables at startup
 */

const requiredEnvVars = ["MONGODB_URI", "PORT", "GEMINI_API_KEY"];

const firebaseEnvVars = [
  "FIREBASE_PROJECT_ID",
  "FIREBASE_CLIENT_EMAIL",
  "FIREBASE_PRIVATE_KEY",
];

/**
 * Validate that all required environment variables are present
 * @throws {Error} If any required variables are missing
 */
export const validateEnvironment = () => {
  const missing = [];

  // Check core required variables
  requiredEnvVars.forEach((key) => {
    if (!process.env[key]) {
      missing.push(key);
    }
  });

  // Check Firebase credentials (either service account path OR individual variables)
  const hasServiceAccountPath = !!process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  const hasIndividualVars = firebaseEnvVars.every((key) => !!process.env[key]);

  if (!hasServiceAccountPath && !hasIndividualVars) {
    missing.push(
      "FIREBASE_SERVICE_ACCOUNT_PATH or (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY)"
    );
  }

  if (missing.length > 0) {
    const errorMessage = `Missing required environment variables:\n${missing
      .map((v) => `  - ${v}`)
      .join("\n")}`;
    throw new Error(errorMessage);
  }
};

export default validateEnvironment;
