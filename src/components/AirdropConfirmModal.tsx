import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Sparkles, AlertCircle } from "lucide-react";

interface AirdropConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  walletCount: number;
  amountPerWallet: string;
  totalAmount: number;
  estimatedGas: string;
}

export const AirdropConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  walletCount,
  amountPerWallet,
  totalAmount,
  estimatedGas
}: AirdropConfirmModalProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 50 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div 
              className="max-w-md w-full rounded-3xl p-8 pointer-events-auto relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgba(0,212,255,0.95) 0%, rgba(123,44,191,0.95) 50%, rgba(224,170,255,0.95) 100%)',
                backdropFilter: 'blur(30px)',
                boxShadow: '0 0 100px rgba(0,255,255,0.6), 0 0 200px rgba(157,0,255,0.4), inset 0 0 100px rgba(255,255,255,0.1)',
                border: '3px solid rgba(255,255,255,0.3)'
              }}
            >
              {/* Glowing border animation */}
              <motion.div
                animate={{
                  boxShadow: [
                    '0 0 60px rgba(0,255,255,0.8)',
                    '0 0 120px rgba(157,0,255,0.8)',
                    '0 0 60px rgba(0,255,255,0.8)'
                  ]
                }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute inset-0 rounded-3xl pointer-events-none"
              />

              {/* Floating particles */}
              {[...Array(15)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 rounded-full"
                  style={{
                    background: ['#FFD700', '#00FFFF', '#FF00FF'][i % 3],
                    boxShadow: '0 0 10px currentColor',
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                  }}
                  animate={{
                    y: [0, -30, 0],
                    opacity: [0, 1, 0],
                    scale: [0, 1.5, 0]
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    delay: i * 0.2
                  }}
                />
              ))}

              {/* Content */}
              <div className="relative z-10">
                {/* Title */}
                <motion.div
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="text-center mb-6"
                >
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 10, 0] }}
                    transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1 }}
                    className="inline-flex items-center justify-center mb-4"
                  >
                    <div 
                      className="p-4 rounded-full"
                      style={{
                        background: 'linear-gradient(135deg, #FFD700, #FFA500)',
                        boxShadow: '0 0 40px rgba(255,215,0,0.8)'
                      }}
                    >
                      <Sparkles className="w-12 h-12 text-white" />
                    </div>
                  </motion.div>

                  <h2 
                    className="text-4xl font-black mb-2"
                    style={{
                      background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FFD700 100%)',
                      backgroundSize: '200% auto',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                      filter: 'drop-shadow(0 0 20px rgba(255,215,0,0.8))',
                      animation: 'gradient-x 3s linear infinite'
                    }}
                  >
                    Ready to make everyone
                  </h2>
                  <h2 
                    className="text-5xl font-black"
                    style={{
                      background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FFD700 100%)',
                      backgroundSize: '200% auto',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                      filter: 'drop-shadow(0 0 20px rgba(255,215,0,0.8))',
                      animation: 'gradient-x 3s linear infinite'
                    }}
                  >
                    FUN AND RICH?
                  </h2>
                </motion.div>

                {/* Stats */}
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="space-y-4 mb-6"
                >
                  <div 
                    className="p-4 rounded-2xl"
                    style={{
                      background: 'rgba(255,255,255,0.2)',
                      backdropFilter: 'blur(10px)',
                      border: '2px solid rgba(255,255,255,0.3)'
                    }}
                  >
                    <div className="flex justify-between items-center text-white">
                      <span className="font-bold text-lg">👥 Number of wallets:</span>
                      <span className="font-black text-2xl text-yellow-300">{walletCount}</span>
                    </div>
                  </div>

                  <div 
                    className="p-4 rounded-2xl"
                    style={{
                      background: 'rgba(255,255,255,0.2)',
                      backdropFilter: 'blur(10px)',
                      border: '2px solid rgba(255,255,255,0.3)'
                    }}
                  >
                    <div className="flex justify-between items-center text-white">
                      <span className="font-bold text-lg">👑 Amount per wallet:</span>
                      <span className="font-black text-2xl text-yellow-300">{amountPerWallet} CAMLY</span>
                    </div>
                  </div>

                  <div 
                    className="p-4 rounded-2xl"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255,215,0,0.3), rgba(255,165,0,0.3))',
                      backdropFilter: 'blur(10px)',
                      border: '3px solid rgba(255,215,0,0.5)',
                      boxShadow: '0 0 30px rgba(255,215,0,0.4)'
                    }}
                  >
                    <div className="flex justify-between items-center text-white">
                      <span className="font-black text-xl">💰 Total CAMLY:</span>
                      <span className="font-black text-3xl text-yellow-300">{totalAmount.toLocaleString()} CAMLY</span>
                    </div>
                  </div>

                  <div 
                    className="p-4 rounded-2xl"
                    style={{
                      background: 'rgba(255,255,255,0.2)',
                      backdropFilter: 'blur(10px)',
                      border: '2px solid rgba(255,255,255,0.3)'
                    }}
                  >
                    <div className="flex justify-between items-center text-white">
                      <span className="font-bold text-lg">⛽ Estimated gas:</span>
                      <span className="font-black text-xl text-cyan-300">{estimatedGas} BNB</span>
                    </div>
                  </div>
                </motion.div>

                {/* Warning */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="mb-6 p-4 rounded-2xl flex items-start gap-3"
                  style={{
                    background: 'rgba(255,165,0,0.2)',
                    border: '2px solid rgba(255,165,0,0.4)'
                  }}
                >
                  <AlertCircle className="w-6 h-6 text-yellow-300 flex-shrink-0 mt-1" />
                  <p className="text-white text-sm font-bold">
                    This will send CAMLY to {walletCount} addresses. Make sure you have enough CAMLY and BNB for gas fees!
                  </p>
                </motion.div>

                {/* Buttons */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="flex gap-4"
                >
                  <Button
                    onClick={onClose}
                    variant="outline"
                    className="flex-1 h-14 text-lg font-black border-3 transition-all duration-300 hover:scale-105"
                    style={{
                      background: 'rgba(255,255,255,0.2)',
                      backdropFilter: 'blur(10px)',
                      border: '3px solid rgba(255,255,255,0.4)',
                      color: 'white'
                    }}
                  >
                    ❌ Cancel
                  </Button>

                  <motion.div 
                    className="flex-1"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      onClick={onConfirm}
                      className="w-full h-14 text-lg font-black border-0 transition-all duration-300 relative overflow-hidden group"
                      style={{
                        background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FFD700 100%)',
                        backgroundSize: '200% auto',
                        boxShadow: '0 0 40px rgba(255,215,0,0.8), 0 10px 30px rgba(255,165,0,0.5)'
                      }}
                    >
                      <motion.div
                        animate={{
                          backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
                        }}
                        transition={{ duration: 3, repeat: Infinity }}
                        className="absolute inset-0"
                        style={{
                          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                          backgroundSize: '200% 100%'
                        }}
                      />
                      <span className="relative z-10 text-purple-900">
                        ✅ CONFIRM & AIRDROP NOW
                      </span>
                    </Button>
                  </motion.div>
                </motion.div>
              </div>

              <style>{`
                @keyframes gradient-x {
                  0%, 100% { background-position: 0% 50%; }
                  50% { background-position: 100% 50%; }
                }
              `}</style>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};