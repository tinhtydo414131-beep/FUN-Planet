import { useState, useEffect, useRef, useCallback } from "react";

export interface CallQualityStats {
  // Audio stats
  audioBitrate: number;
  audioPacketLoss: number;
  audioJitter: number;
  
  // Video stats
  videoBitrate: number;
  videoPacketLoss: number;
  videoFrameRate: number;
  videoResolution: { width: number; height: number };
  
  // Connection stats
  roundTripTime: number; // latency in ms
  connectionState: string;
  iceState: string;
  
  // Quality indicator
  quality: "excellent" | "good" | "fair" | "poor";
}

const DEFAULT_STATS: CallQualityStats = {
  audioBitrate: 0,
  audioPacketLoss: 0,
  audioJitter: 0,
  videoBitrate: 0,
  videoPacketLoss: 0,
  videoFrameRate: 0,
  videoResolution: { width: 0, height: 0 },
  roundTripTime: 0,
  connectionState: "new",
  iceState: "new",
  quality: "good",
};

function calculateQuality(stats: CallQualityStats): CallQualityStats["quality"] {
  const { roundTripTime, audioPacketLoss, videoPacketLoss } = stats;
  const avgPacketLoss = (audioPacketLoss + videoPacketLoss) / 2;

  if (roundTripTime < 100 && avgPacketLoss < 1) {
    return "excellent";
  } else if (roundTripTime < 200 && avgPacketLoss < 3) {
    return "good";
  } else if (roundTripTime < 400 && avgPacketLoss < 8) {
    return "fair";
  }
  return "poor";
}

export function useCallQualityStats(peerConnection: RTCPeerConnection | null) {
  const [stats, setStats] = useState<CallQualityStats>(DEFAULT_STATS);
  const prevStatsRef = useRef<Map<string, any>>(new Map());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const parseStats = useCallback(async () => {
    if (!peerConnection) return;

    try {
      const report = await peerConnection.getStats();
      const newStats: Partial<CallQualityStats> = {
        connectionState: peerConnection.connectionState,
        iceState: peerConnection.iceConnectionState,
      };

      let totalAudioBytesReceived = 0;
      let totalVideoBytesReceived = 0;
      let prevAudioBytesReceived = 0;
      let prevVideoBytesReceived = 0;

      report.forEach((stat) => {
        // Get round-trip time from candidate-pair
        if (stat.type === "candidate-pair" && stat.state === "succeeded") {
          if (stat.currentRoundTripTime !== undefined) {
            newStats.roundTripTime = Math.round(stat.currentRoundTripTime * 1000);
          }
        }

        // Inbound audio stats
        if (stat.type === "inbound-rtp" && stat.kind === "audio") {
          totalAudioBytesReceived = stat.bytesReceived || 0;
          const prevStat = prevStatsRef.current.get(stat.id);
          if (prevStat) {
            prevAudioBytesReceived = prevStat.bytesReceived || 0;
            const byteDiff = totalAudioBytesReceived - prevAudioBytesReceived;
            newStats.audioBitrate = Math.round((byteDiff * 8) / 1000); // kbps
          }
          
          if (stat.packetsLost !== undefined && stat.packetsReceived !== undefined) {
            const totalPackets = stat.packetsLost + stat.packetsReceived;
            newStats.audioPacketLoss = totalPackets > 0 
              ? Math.round((stat.packetsLost / totalPackets) * 100 * 10) / 10 
              : 0;
          }
          
          if (stat.jitter !== undefined) {
            newStats.audioJitter = Math.round(stat.jitter * 1000);
          }
          
          prevStatsRef.current.set(stat.id, { bytesReceived: totalAudioBytesReceived });
        }

        // Inbound video stats
        if (stat.type === "inbound-rtp" && stat.kind === "video") {
          totalVideoBytesReceived = stat.bytesReceived || 0;
          const prevStat = prevStatsRef.current.get(stat.id);
          if (prevStat) {
            prevVideoBytesReceived = prevStat.bytesReceived || 0;
            const byteDiff = totalVideoBytesReceived - prevVideoBytesReceived;
            newStats.videoBitrate = Math.round((byteDiff * 8) / 1000); // kbps
          }
          
          if (stat.packetsLost !== undefined && stat.packetsReceived !== undefined) {
            const totalPackets = stat.packetsLost + stat.packetsReceived;
            newStats.videoPacketLoss = totalPackets > 0 
              ? Math.round((stat.packetsLost / totalPackets) * 100 * 10) / 10 
              : 0;
          }
          
          if (stat.framesPerSecond !== undefined) {
            newStats.videoFrameRate = Math.round(stat.framesPerSecond);
          }
          
          if (stat.frameWidth && stat.frameHeight) {
            newStats.videoResolution = {
              width: stat.frameWidth,
              height: stat.frameHeight,
            };
          }
          
          prevStatsRef.current.set(stat.id, { bytesReceived: totalVideoBytesReceived });
        }
      });

      setStats((prev) => {
        const updated = { ...prev, ...newStats };
        updated.quality = calculateQuality(updated);
        return updated;
      });
    } catch (error) {
      console.error("[CallQuality] Error getting stats:", error);
    }
  }, [peerConnection]);

  useEffect(() => {
    if (!peerConnection) {
      setStats(DEFAULT_STATS);
      return;
    }

    // Parse stats every second
    intervalRef.current = setInterval(parseStats, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      prevStatsRef.current.clear();
    };
  }, [peerConnection, parseStats]);

  return stats;
}
