import { motion } from "framer-motion";
import { FunPlanetHonorBoard } from "./FunPlanetHonorBoard";
import { FunPlanetTopRanking } from "./FunPlanetTopRanking";

export const FunPlanetStatsSection = () => {
  return (
    <section className="py-8 px-4 md:py-12">
      <div className="container mx-auto max-w-7xl">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-8 text-center"
        >
          <h2 className="text-3xl font-bold md:text-4xl">
            <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              🌟 FUN Planet Stats
            </span>
          </h2>
          <p className="mt-2 text-muted-foreground">
            Cộng đồng game thủ đang phát triển mạnh mẽ!
          </p>
        </motion.div>

        {/* Two Column Layout */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Honor Board */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            <FunPlanetHonorBoard />
          </motion.div>

          {/* Top Ranking */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <FunPlanetTopRanking />
          </motion.div>
        </div>
      </div>
    </section>
  );
};
