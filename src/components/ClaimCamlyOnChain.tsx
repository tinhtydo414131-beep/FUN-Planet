import { motion } from "framer-motion";
import { Gift, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useTranslation } from "react-i18next";

export const ClaimCamlyOnChain = () => {
  const { t, i18n } = useTranslation();
  const isVN = i18n.language === 'vi';

  return (
    <Card className="overflow-hidden border-2 border-muted/50 bg-gradient-to-br from-card via-card to-muted/20">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center">
            <Gift className="w-6 h-6 text-white" />
          </div>
          <div>
            <CardTitle className="text-xl text-muted-foreground">
              {isVN ? 'Chương Trình Airdrop CAMLY' : 'CAMLY Airdrop Program'}
            </CardTitle>
            <CardDescription>
              {isVN ? 'Chương trình đã kết thúc' : 'Program has ended'}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Ended Message */}
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center p-6 rounded-2xl bg-muted/30 border border-muted"
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
            <AlertCircle className="w-10 h-10 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold text-muted-foreground mb-2">
            {isVN ? 'Chương Trình Đã Kết Thúc' : 'Program Ended'}
          </div>
          <p className="text-muted-foreground">
            {isVN 
              ? 'Chương trình airdrop 1 tỷ CAMLY đã hoàn thành. Cảm ơn tất cả những ai đã tham gia!'
              : 'The 1 billion CAMLY airdrop program has completed. Thank you to everyone who participated!'}
          </p>
        </motion.div>

        {/* Info */}
        <p className="text-xs text-center text-muted-foreground">
          {isVN 
            ? '💎 Theo dõi các chương trình airdrop mới trong tương lai!'
            : '💎 Stay tuned for future airdrop programs!'}
        </p>
      </CardContent>
    </Card>
  );
};
