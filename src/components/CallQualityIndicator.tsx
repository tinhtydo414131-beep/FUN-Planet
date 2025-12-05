import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Signal, SignalHigh, SignalMedium, SignalLow, ChevronUp, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { CallQualityStats } from "@/hooks/useCallQualityStats";

interface CallQualityIndicatorProps {
  stats: CallQualityStats;
  isVideoCall: boolean;
}

export function CallQualityIndicator({ stats, isVideoCall }: CallQualityIndicatorProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getQualityIcon = () => {
    switch (stats.quality) {
      case "excellent":
        return <SignalHigh className="w-4 h-4 text-green-400" />;
      case "good":
        return <SignalMedium className="w-4 h-4 text-green-400" />;
      case "fair":
        return <SignalMedium className="w-4 h-4 text-yellow-400" />;
      case "poor":
        return <SignalLow className="w-4 h-4 text-red-400" />;
      default:
        return <Signal className="w-4 h-4 text-gray-400" />;
    }
  };

  const getQualityColor = () => {
    switch (stats.quality) {
      case "excellent":
        return "text-green-400";
      case "good":
        return "text-green-400";
      case "fair":
        return "text-yellow-400";
      case "poor":
        return "text-red-400";
      default:
        return "text-gray-400";
    }
  };

  const formatBitrate = (kbps: number) => {
    if (kbps >= 1000) {
      return `${(kbps / 1000).toFixed(1)} Mbps`;
    }
    return `${kbps} kbps`;
  };

  return (
    <div className="absolute top-4 left-4 z-10">
      <Button
        variant="ghost"
        size="sm"
        className="bg-black/50 hover:bg-black/70 text-white px-3 py-1 h-auto"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {getQualityIcon()}
        <span className={`ml-2 text-xs capitalize ${getQualityColor()}`}>
          {stats.quality}
        </span>
        {isExpanded ? (
          <ChevronUp className="w-3 h-3 ml-1" />
        ) : (
          <ChevronDown className="w-3 h-3 ml-1" />
        )}
      </Button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-2 bg-black/80 backdrop-blur-sm rounded-lg p-3 text-white text-xs min-w-[200px]"
          >
            <h4 className="font-semibold mb-2 text-white/90">Connection Stats</h4>
            
            {/* Latency */}
            <div className="flex justify-between mb-1">
              <span className="text-white/70">Latency:</span>
              <span className={stats.roundTripTime > 200 ? "text-yellow-400" : "text-white"}>
                {stats.roundTripTime} ms
              </span>
            </div>

            {/* Audio Stats */}
            <div className="border-t border-white/20 mt-2 pt-2">
              <h5 className="font-medium mb-1 text-white/80">Audio</h5>
              <div className="flex justify-between mb-1">
                <span className="text-white/70">Bitrate:</span>
                <span>{formatBitrate(stats.audioBitrate)}</span>
              </div>
              <div className="flex justify-between mb-1">
                <span className="text-white/70">Packet Loss:</span>
                <span className={stats.audioPacketLoss > 3 ? "text-yellow-400" : "text-white"}>
                  {stats.audioPacketLoss}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">Jitter:</span>
                <span className={stats.audioJitter > 30 ? "text-yellow-400" : "text-white"}>
                  {stats.audioJitter} ms
                </span>
              </div>
            </div>

            {/* Video Stats (only for video calls) */}
            {isVideoCall && (
              <div className="border-t border-white/20 mt-2 pt-2">
                <h5 className="font-medium mb-1 text-white/80">Video</h5>
                <div className="flex justify-between mb-1">
                  <span className="text-white/70">Bitrate:</span>
                  <span>{formatBitrate(stats.videoBitrate)}</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span className="text-white/70">Packet Loss:</span>
                  <span className={stats.videoPacketLoss > 3 ? "text-yellow-400" : "text-white"}>
                    {stats.videoPacketLoss}%
                  </span>
                </div>
                <div className="flex justify-between mb-1">
                  <span className="text-white/70">Frame Rate:</span>
                  <span className={stats.videoFrameRate < 24 ? "text-yellow-400" : "text-white"}>
                    {stats.videoFrameRate} fps
                  </span>
                </div>
                {stats.videoResolution.width > 0 && (
                  <div className="flex justify-between">
                    <span className="text-white/70">Resolution:</span>
                    <span>
                      {stats.videoResolution.width}x{stats.videoResolution.height}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Connection State */}
            <div className="border-t border-white/20 mt-2 pt-2">
              <div className="flex justify-between">
                <span className="text-white/70">Connection:</span>
                <span className="capitalize">{stats.connectionState}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default CallQualityIndicator;
