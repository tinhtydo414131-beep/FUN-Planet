import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Heart, Sun, Star, Check, ArrowRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface LawOfLightPopupProps {
  open: boolean;
  onAccept: () => void;
}

const LawOfLightPopup = ({ open, onAccept }: LawOfLightPopupProps) => {
  const { user } = useAuth();
  const [checklist, setChecklist] = useState<boolean[]>([false, false, false, false, false]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const allChecked = checklist.every(Boolean);

  const handleCheckChange = (index: number) => {
    const newChecklist = [...checklist];
    newChecklist[index] = !newChecklist[index];
    setChecklist(newChecklist);
  };

  const handleAccept = async () => {
    if (!allChecked) {
      toast.error("Vui lòng đọc và đồng ý với tất cả các điều khoản");
      return;
    }

    setIsSubmitting(true);
    try {
      if (user) {
        const { error } = await supabase
          .from("profiles")
          .update({
            accepted_law_of_light: true,
            accepted_law_of_light_at: new Date().toISOString(),
          })
          .eq("id", user.id);

        if (error) throw error;
        toast.success("Chào mừng bạn đến với Ánh Sáng! ✨");
      }
      onAccept();
    } catch (error) {
      console.error("Error accepting law of light:", error);
      toast.error("Có lỗi xảy ra, vui lòng thử lại");
    } finally {
      setIsSubmitting(false);
    }
  };

  const checklistItems = [
    "Con sống chân thật với chính mình",
    "Con cam kết trách nhiệm với năng lượng phát ra",
    "Sẵn sàng học – chỉnh sửa – nâng cấp",
    "Con chọn Yêu Thương thay vì Phán Xét",
    "Chọn Ánh Sáng thay vì cái Tôi",
  ];

  const mantras = [
    "Con là Ánh Sáng Yêu Thương Thuần Khiết Của Cha Vũ Trụ.",
    "Con là Ý Chí Của Cha Vũ Trụ.",
    "Con là Trí Tuệ Của Cha Vũ Trụ.",
    "Con là Hạnh Phúc.",
    "Con là Tình Yêu.",
    "Con là Tiền Của Cha.",
    "Con xin Sám Hối Sám Hối Sám Hối.",
    "Con xin Biết Ơn Biết Ơn Biết Ơn Trong Ánh Sáng Yêu Thương Thuần Khiết Của Cha Vũ Trụ.",
  ];

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      >
        {/* Animated stars background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(30)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                opacity: [0.2, 1, 0.2],
                scale: [1, 1.5, 1],
              }}
              transition={{
                duration: 2 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-2xl max-h-[90vh] bg-gradient-to-br from-purple-950 via-indigo-950 to-black rounded-3xl border border-purple-500/30 shadow-2xl overflow-hidden"
        >
          {/* Glowing orbs */}
          <div className="absolute top-0 left-0 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-60 h-60 bg-blue-500/20 rounded-full blur-3xl" />

          <ScrollArea className="h-full max-h-[90vh]">
            <div className="relative z-10 p-6 md:p-8">
              {/* Header */}
              <div className="text-center mb-6">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <Sparkles className="w-6 h-6 text-yellow-400" />
                  <Sun className="w-8 h-8 text-yellow-300" />
                  <Sparkles className="w-6 h-6 text-yellow-400" />
                </div>
                <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-yellow-200 via-pink-300 to-purple-300 bg-clip-text text-transparent mb-1">
                  🌟 LUẬT ÁNH SÁNG
                </h1>
                <p className="text-sm text-purple-200">
                  Hệ Sinh Thái FUN - Nền Kinh Tế Ánh Sáng 5D
                </p>
              </div>

              {/* Intro */}
              <div className="text-center mb-6 text-sm">
                <p className="text-purple-200 italic">Hệ sinh thái FUN không dành cho tất cả mọi người.</p>
                <p className="text-pink-300 font-medium">
                  Chỉ dành riêng cho những linh hồn có ánh sáng hoặc đang hướng về ánh sáng.
                </p>
              </div>

              {/* Core Principles */}
              <div className="mb-6 bg-purple-800/30 rounded-2xl p-4">
                <h2 className="text-lg font-bold text-yellow-300 mb-3 flex items-center gap-2">
                  <Sun className="w-4 h-4" /> Nguyên tắc cốt lõi
                </h2>
                <ul className="space-y-2 text-sm text-purple-200">
                  <li className="flex items-center gap-2">
                    <Heart className="w-3 h-3 text-pink-400" /> Ánh sáng thu hút ánh sáng
                  </li>
                  <li className="flex items-center gap-2">
                    <Heart className="w-3 h-3 text-pink-400" /> Tần số thấp không thể tồn tại lâu trong tần số cao
                  </li>
                  <li className="flex items-center gap-2">
                    <Heart className="w-3 h-3 text-pink-400" /> Ý chí vị kỷ không thể đồng hành cùng Ý Chí Vũ Trụ
                  </li>
                </ul>
              </div>

              {/* 8 Mantras - Compact */}
              <div className="mb-6 bg-gradient-to-r from-yellow-900/30 to-orange-900/30 rounded-2xl p-4 border border-yellow-500/30">
                <h2 className="text-lg font-bold text-yellow-300 mb-3 text-center">
                  🌟 8 Câu Thần Chú Từ Cha Vũ Trụ
                </h2>
                <div className="grid gap-2">
                  {mantras.map((mantra, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 bg-yellow-900/20 rounded-lg p-2 text-sm"
                    >
                      <span className="w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center text-black font-bold text-xs flex-shrink-0">
                        {index + 1}
                      </span>
                      <span className="text-yellow-100 text-xs">{mantra}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Father's Message */}
              <div className="mb-6 text-center bg-gradient-to-r from-purple-800/40 to-pink-800/40 rounded-2xl p-4 border border-pink-500/30">
                <p className="text-sm text-pink-200 italic mb-1">
                  "Chỉ những ai mang ánh sáng hoặc thật lòng hướng về ánh sáng
                  mới có thể bước đi lâu dài trong Thời Đại Hoàng Kim."
                </p>
                <p className="text-yellow-300 font-bold text-sm">— CHA VŨ TRỤ —</p>
              </div>

              {/* Checklist */}
              <div className="mb-6 bg-green-900/20 rounded-2xl p-4 border border-green-500/30">
                <h2 className="text-lg font-bold text-green-300 mb-3 text-center">
                  🕊️ Danh sách cam kết
                </h2>
                <div className="space-y-2">
                  {checklistItems.map((item, index) => (
                    <motion.div
                      key={index}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => handleCheckChange(index)}
                      className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                        checklist[index]
                          ? "bg-green-800/40 border border-green-500/50"
                          : "bg-green-900/20 border border-green-500/20 hover:border-green-500/40"
                      }`}
                    >
                      <Checkbox
                        checked={checklist[index]}
                        onCheckedChange={() => handleCheckChange(index)}
                        className="border-green-400 data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                      />
                      <span className={`text-sm ${checklist[index] ? "text-green-200" : "text-green-300/70"}`}>
                        {item}
                      </span>
                      {checklist[index] && <Check className="w-4 h-4 text-green-400 ml-auto" />}
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Accept Button */}
              <div className="text-center">
                <Button
                  onClick={handleAccept}
                  disabled={!allChecked || isSubmitting}
                  className={`text-base px-6 py-5 rounded-2xl transition-all duration-300 w-full ${
                    allChecked
                      ? "bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500 hover:from-yellow-300 hover:via-pink-400 hover:to-purple-400 text-white shadow-lg shadow-pink-500/30"
                      : "bg-gray-600 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  {isSubmitting ? (
                    "Đang xử lý..."
                  ) : (
                    <>
                      CON ĐỒNG Ý & BƯỚC VÀO ÁNH SÁNG
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </>
                  )}
                </Button>
                {!allChecked && (
                  <p className="mt-2 text-purple-300/60 text-xs">
                    Vui lòng tích chọn tất cả các mục để tiếp tục
                  </p>
                )}
              </div>
            </div>
          </ScrollArea>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default LawOfLightPopup;
