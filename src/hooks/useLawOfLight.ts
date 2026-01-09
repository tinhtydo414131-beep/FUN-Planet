import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export const useLawOfLight = () => {
  const { user, loading: authLoading } = useAuth();
  const [hasAccepted, setHasAccepted] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    const checkAcceptance = async () => {
      if (authLoading) return;
      
      if (!user) {
        setHasAccepted(null);
        setShowPopup(false);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("accepted_law_of_light")
          .eq("id", user.id)
          .single();

        if (error) {
          console.error("Error checking law of light acceptance:", error);
          setHasAccepted(false);
        } else {
          setHasAccepted(data?.accepted_law_of_light || false);
          // Show popup if user hasn't accepted yet
          if (!data?.accepted_law_of_light) {
            setShowPopup(true);
          }
        }
      } catch (error) {
        console.error("Error:", error);
        setHasAccepted(false);
      } finally {
        setLoading(false);
      }
    };

    checkAcceptance();
  }, [user, authLoading]);

  const handleAccept = () => {
    setHasAccepted(true);
    setShowPopup(false);
  };

  return {
    hasAccepted,
    loading: loading || authLoading,
    showPopup,
    handleAccept,
  };
};
