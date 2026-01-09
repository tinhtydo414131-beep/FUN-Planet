import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, Heart, Sun, Moon, Star, Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const LawOfLight = () => {
  const navigate = useNavigate();
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
      navigate("/");
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-950 via-indigo-950 to-black text-white overflow-hidden relative">
      {/* Animated stars background */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(50)].map((_, i) => (
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

      {/* Glowing orbs */}
      <div className="absolute top-20 left-10 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-pink-500/10 rounded-full blur-3xl" />

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="w-8 h-8 text-yellow-400" />
            <Star className="w-6 h-6 text-pink-400" />
            <Sun className="w-10 h-10 text-yellow-300" />
            <Star className="w-6 h-6 text-pink-400" />
            <Sparkles className="w-8 h-8 text-yellow-400" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-yellow-200 via-pink-300 to-purple-300 bg-clip-text text-transparent mb-2">
            🌟 NGƯỜI SỬ DỤNG HỆ SINH THÁI VUI VẺ
          </h1>
          <p className="text-lg text-purple-200 font-medium">
            MẠNG XÃ HỘI THỜI ĐẠI HOÀNG KIM – NỀN KINH TẾ ÁNH SÁNG 5D
          </p>
        </motion.div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-purple-900/50 to-indigo-900/50 backdrop-blur-lg rounded-3xl p-6 md:p-8 border border-purple-500/30 shadow-2xl"
        >
          {/* Intro */}
          <div className="text-center mb-8 space-y-2">
            <p className="text-purple-200 italic">Hệ sinh thái FUN không dành cho tất cả mọi người.</p>
            <p className="text-pink-300 font-semibold">
              Hệ sinh thái FUN chỉ dành riêng cho những linh hồn có ánh sáng hoặc đang hướng về ánh sáng.
            </p>
          </div>

          {/* Who are you section */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-yellow-300 mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5" /> Bạn là ai?
            </h2>
            <p className="text-purple-100 mb-3">Người dùng của Hệ sinh thái FUN là những người:</p>
            <ul className="space-y-2 text-purple-200">
              {[
                "Tỉnh thức – hoặc đang trên đường tỉnh thức",
                "Chân thật với chính mình",
                "Chân thành với người khác",
                "Sống tích cực, tử tế, có trách nhiệm với năng lượng phát ra của mình",
                "Biết yêu thương – biết biết ơn – biết sám hối",
                "Tin vào điều thiện, tin vào ánh sáng, tin vào Trật Tự Cao Hơn của Vũ Trụ",
              ].map((item, index) => (
                <li key={index} className="flex items-start gap-2">
                  <Star className="w-4 h-4 text-yellow-400 mt-1 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-pink-200 italic text-center">
              Bạn có thể chưa hoàn hảo, nhưng bạn có trái tim hướng về điều tốt đẹp hơn.
            </p>
          </div>

          {/* Core Principles */}
          <div className="mb-8 bg-purple-800/30 rounded-2xl p-5">
            <h2 className="text-xl font-bold text-yellow-300 mb-4 flex items-center gap-2">
              <Sun className="w-5 h-5" /> Nguyên tắc cốt lõi của Hệ sinh thái FUN
            </h2>
            <p className="text-purple-100 mb-3">FUN Ecosystem vận hành theo Luật Ánh Sáng, không theo số đông.</p>
            <ul className="space-y-2 text-purple-200">
              <li className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-pink-400" /> Ánh sáng thu hút ánh sáng
              </li>
              <li className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-pink-400" /> Tần số thấp không thể tồn tại lâu trong tần số cao
              </li>
              <li className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-pink-400" /> Ý chí vị kỷ không thể đồng hành cùng Ý Chí Vũ Trụ
              </li>
            </ul>
          </div>

          {/* Who does NOT belong */}
          <div className="mb-8 bg-red-900/20 rounded-2xl p-5 border border-red-500/30">
            <h2 className="text-xl font-bold text-red-300 mb-4 flex items-center gap-2">
              <Moon className="w-5 h-5" /> Ai KHÔNG thuộc về Hệ sinh thái FUN?
            </h2>
            <ul className="space-y-2 text-red-200/80">
              {[
                "Người chỉ tìm lợi ích mà không muốn trưởng thành",
                "Người dùng trí tuệ nhưng thiếu tâm linh",
                "Người nói về ánh sáng nhưng sống bằng bóng tối",
                "Người lấy danh nghĩa tâm linh để nuôi cái tôi",
                "Người không chịu nhìn lại chính mình",
              ].map((item, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-red-400">✕</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-red-200/60 italic text-sm text-center">
              👉 Cửa FUN Ecosystem không khóa, nhưng Ánh Sáng tự động sàng lọc.
            </p>
          </div>

          {/* 8 Mantras */}
          <div className="mb-8 bg-gradient-to-r from-yellow-900/30 to-orange-900/30 rounded-2xl p-5 border border-yellow-500/30">
            <h2 className="text-xl font-bold text-yellow-300 mb-4 text-center">
              🌟 8 Câu Thần Chú Từ Cha Vũ Trụ
            </h2>
            <div className="grid gap-3">
              {mantras.map((mantra, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="flex items-center gap-3 bg-yellow-900/20 rounded-xl p-3"
                >
                  <span className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center text-black font-bold text-sm">
                    {index + 1}
                  </span>
                  <span className="text-yellow-100">{mantra}</span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Father's Message */}
          <div className="mb-8 text-center bg-gradient-to-r from-purple-800/40 to-pink-800/40 rounded-2xl p-6 border border-pink-500/30">
            <p className="text-lg text-pink-200 italic mb-2">
              "Chỉ những ai mang ánh sáng hoặc thật lòng hướng về ánh sáng
              mới có thể bước đi lâu dài trong Thời Đại Hoàng Kim."
            </p>
            <p className="text-yellow-300 font-bold">— CHA VŨ TRỤ —</p>
          </div>

          {/* Checklist */}
          <div className="mb-8 bg-green-900/20 rounded-2xl p-5 border border-green-500/30">
            <h2 className="text-xl font-bold text-green-300 mb-4 text-center">
              🕊️ Danh sách cam kết
            </h2>
            <p className="text-green-200/70 text-sm text-center mb-4">
              (Tích chọn tất cả để đồng ý và bước vào Ánh Sáng)
            </p>
            <div className="space-y-3">
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
                  <span className={`${checklist[index] ? "text-green-200" : "text-green-300/70"}`}>
                    {item}
                  </span>
                  {checklist[index] && <Check className="w-4 h-4 text-green-400 ml-auto" />}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Accept Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-center"
          >
            <Button
              onClick={handleAccept}
              disabled={!allChecked || isSubmitting}
              className={`text-lg px-8 py-6 rounded-2xl transition-all duration-300 ${
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
              <p className="mt-3 text-purple-300/60 text-sm">
                Vui lòng tích chọn tất cả các mục để tiếp tục
              </p>
            )}
          </motion.div>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-center mt-8 text-purple-400/50 text-sm"
        >
          💫✨⚡️🌟 FUN Ecosystem - Nền Kinh Tế Ánh Sáng 5D
        </motion.div>
      </div>
    </div>
  );
};

export default LawOfLight;
