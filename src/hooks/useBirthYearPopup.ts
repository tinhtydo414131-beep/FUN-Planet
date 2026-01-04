import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const POPUP_DELAY_MS = 5000; // Wait 5 seconds after login
const POPUP_DISMISSED_KEY = "birth_year_popup_dismissed";

export const useBirthYearPopup = () => {
  const { user } = useAuth();
  const [showPopup, setShowPopup] = useState(false);
  const [birthYear, setBirthYear] = useState<number | null>(null);
  const hasCheckedRef = useRef(false);

  useEffect(() => {
    if (!user || hasCheckedRef.current) return;

    const checkBirthYear = async () => {
      hasCheckedRef.current = true;
      
      // Check if popup was dismissed before
      const dismissed = localStorage.getItem(`${POPUP_DISMISSED_KEY}_${user.id}`);
      if (dismissed) return;

      // Fetch user's birth_year
      const { data } = await supabase
        .from("profiles")
        .select("birth_year")
        .eq("id", user.id)
        .single();

      if (data?.birth_year) {
        setBirthYear(data.birth_year);
        return; // Already has birth year
      }

      // Show popup after delay
      const timer = setTimeout(() => {
        setShowPopup(true);
      }, POPUP_DELAY_MS);

      return () => clearTimeout(timer);
    };

    checkBirthYear();
  }, [user]);

  // Reset when user changes
  useEffect(() => {
    if (!user) {
      hasCheckedRef.current = false;
      setShowPopup(false);
      setBirthYear(null);
    }
  }, [user]);

  const closePopup = () => {
    setShowPopup(false);
    // Mark as dismissed so we don't show again
    if (user) {
      localStorage.setItem(`${POPUP_DISMISSED_KEY}_${user.id}`, "true");
    }
  };

  const onBirthYearSaved = (year: number) => {
    setBirthYear(year);
    setShowPopup(false);
    // Clear dismissal flag since they saved
    if (user) {
      localStorage.removeItem(`${POPUP_DISMISSED_KEY}_${user.id}`);
    }
  };

  return {
    showPopup,
    birthYear,
    closePopup,
    onBirthYearSaved,
  };
};
