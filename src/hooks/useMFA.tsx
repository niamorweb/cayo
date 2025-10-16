// hooks/useMFA.ts
import { createClient } from "@/lib/supabase/client";

export const useMFA = () => {
  const supabase = createClient();

  const getFactors = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user?.factors || [];
  };

  const enrollMFA = async () => {
    // Vérifier s'il y a déjà un factor
    const factors = await getFactors();
    console.log("factorsfactors ;; ", factors);
    console.log("factorsfactors  ;; ", factors.length);

    if (factors.length > 0) {
      return { data: null, error: new Error("MFA déjà configuré") };
    }

    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: "totp",
    });
    return { data, error };
  };

  const unenrollMFA = async (factorId: string) => {
    const { data, error } = await supabase.auth.mfa.unenroll({
      factorId,
    });
    return { data, error };
  };

  const verifyEnrollment = async (factorId: string, code: string) => {
    const { data, error } = await supabase.auth.mfa.challengeAndVerify({
      factorId,
      code,
    });
    return { data, error };
  };

  const challengeAndVerifyMFA = async (factorId: string, code: string) => {
    const { data, error } = await supabase.auth.mfa.challengeAndVerify({
      factorId,
      code,
    });
    return { data, error };
  };

  return {
    challengeAndVerifyMFA,
    getFactors,
    enrollMFA,
    unenrollMFA,
    verifyEnrollment,
  };
};
