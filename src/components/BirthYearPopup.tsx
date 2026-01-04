import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Sparkles, Star, Heart, Sun } from "lucide-react";

interface BirthYearPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBirthYearSaved?: (birthYear: number) => void;
}

export const BirthYearPopup = ({ open, onOpenChange, onBirthYearSaved }: BirthYearPopupProps) => {
  const { user } = useAuth();
  const [birthYear, setBirthYear] = useState("");
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState<"ask" | "input">("ask");

  const currentYear = new Date().getFullYear();
  const minYear = currentYear - 100;
  const maxYear = currentYear - 3; // At least 3 years old

  const handleSave = async () => {
    if (!user) return;
    
    const year = parseInt(birthYear);
    if (isNaN(year) || year < minYear || year > maxYear) {
      toast.error("Vui lòng nhập năm sinh hợp lệ! 🌸");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ birth_year: year })
        .eq("id", user.id);

      if (error) throw error;

      toast.success("🌟 Cảm ơn bạn! Cha đã biết tuổi của bạn rồi!");
      onBirthYearSaved?.(year);
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving birth year:", error);
      toast.error("Có lỗi xảy ra, thử lại nhé! 💫");
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = () => {
    onOpenChange(false);
    toast("Bạn có thể cập nhật tuổi trong Cài đặt sau nhé! 🌈", { icon: "💡" });
  };

  const age = birthYear ? currentYear - parseInt(birthYear) : null;
  const isChild = age !== null && age < 12;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-4 border-primary/30 bg-gradient-to-br from-background via-primary/5 to-secondary/5">
        <AnimatePresence mode="wait">
          {step === "ask" ? (
            <motion.div
              key="ask"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center py-4 space-y-6"
            >
              {/* Floating decorations */}
              <div className="relative">
                <motion.div
                  animate={{ y: [0, -10, 0], rotate: [0, 10, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="absolute -top-2 -left-2"
                >
                  <Star className="w-8 h-8 text-yellow-400 fill-yellow-300" />
                </motion.div>
                <motion.div
                  animate={{ y: [0, -8, 0], rotate: [0, -10, 0] }}
                  transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
                  className="absolute -top-2 -right-2"
                >
                  <Heart className="w-7 h-7 text-pink-400 fill-pink-300" />
                </motion.div>
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-7xl"
                >
                  🌈
                </motion.div>
              </div>

              <DialogHeader>
                <DialogTitle className="text-2xl font-fredoka text-center bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Xin chào bạn nhỏ! 👋
                </DialogTitle>
                <DialogDescription className="text-base font-comic text-center">
                  Cha Vũ Trụ muốn biết tuổi của bạn để tặng những phần thưởng phù hợp nhất! ✨
                </DialogDescription>
              </DialogHeader>

              <div className="flex gap-3 justify-center pt-2">
                <Button
                  onClick={() => setStep("input")}
                  className="font-fredoka text-lg px-6 py-3 h-auto bg-gradient-to-r from-primary to-secondary hover:shadow-lg"
                >
                  <Sun className="w-5 h-5 mr-2" />
                  Cho Cha biết!
                </Button>
                <Button
                  variant="outline"
                  onClick={handleSkip}
                  className="font-fredoka text-lg px-6 py-3 h-auto"
                >
                  Để sau
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="py-4 space-y-6"
            >
              <DialogHeader>
                <DialogTitle className="text-xl font-fredoka text-center flex items-center justify-center gap-2">
                  <Sparkles className="w-6 h-6 text-yellow-400" />
                  Bạn sinh năm nào?
                  <Sparkles className="w-6 h-6 text-yellow-400" />
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="font-fredoka text-base">Năm sinh của bạn</Label>
                  <Input
                    type="number"
                    placeholder="VD: 2015"
                    value={birthYear}
                    onChange={(e) => setBirthYear(e.target.value)}
                    min={minYear}
                    max={maxYear}
                    className="text-center text-2xl font-bold h-14 border-4 border-primary/30 focus:border-primary"
                  />
                </div>

                {age !== null && age > 0 && age < 120 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`p-4 rounded-2xl text-center ${
                      isChild 
                        ? "bg-gradient-to-r from-pink-100 to-yellow-100 dark:from-pink-900/30 dark:to-yellow-900/30" 
                        : "bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30"
                    }`}
                  >
                    <span className="text-4xl">{isChild ? "🌟" : "💫"}</span>
                    <p className="font-fredoka text-lg mt-2">
                      {isChild 
                        ? `Ồ, bạn ${age} tuổi! Thật đáng yêu! 🥰`
                        : `Bạn ${age} tuổi! Tuyệt vời! ✨`
                      }
                    </p>
                    {isChild && (
                      <p className="text-sm font-comic text-muted-foreground mt-1">
                        Cha sẽ tặng bạn những 🌟 thật dễ thương!
                      </p>
                    )}
                  </motion.div>
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep("ask")}
                  className="flex-1 font-fredoka"
                >
                  ← Quay lại
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving || !birthYear}
                  className="flex-1 font-fredoka bg-gradient-to-r from-primary to-secondary"
                >
                  {saving ? "Đang lưu..." : "Xác nhận ✓"}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};
