import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Wand2, Loader2, RefreshCw, Save, ChevronRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface StorySegment {
  text: string;
  choices?: { id: string; text: string }[];
  isChoice?: boolean;
}

interface Story {
  id?: string;
  title: string;
  theme: string;
  segments: StorySegment[];
  completed: boolean;
}

const STORY_THEMES = [
  { id: "fairy_tale", name: "Cổ tích", icon: "🏰", color: "from-pink-500 to-purple-500" },
  { id: "adventure", name: "Phiêu lưu", icon: "🗺️", color: "from-amber-500 to-orange-500" },
  { id: "science", name: "Khoa học", icon: "🔬", color: "from-blue-500 to-cyan-500" },
  { id: "animals", name: "Động vật", icon: "🦁", color: "from-green-500 to-emerald-500" },
  { id: "space", name: "Vũ trụ", icon: "🚀", color: "from-indigo-500 to-purple-500" },
];

export function StoryMode() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
  const [currentStory, setCurrentStory] = useState<Story | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [savedStories, setSavedStories] = useState<Story[]>([]);

  useEffect(() => {
    if (user) loadSavedStories();
  }, [user]);

  const loadSavedStories = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('angel_ai_stories')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (data) {
      setSavedStories(data.map(s => ({
        id: s.id,
        title: s.title,
        theme: s.theme,
        segments: (s.content as unknown as StorySegment[]) || [],
        completed: s.completed || false
      })));
    }
  };

  const startNewStory = async (theme: string) => {
    setSelectedTheme(theme);
    setIsGenerating(true);

    try {
      const themeInfo = STORY_THEMES.find(t => t.id === theme);
      const prompt = `Bắt đầu một câu chuyện ${themeInfo?.name.toLowerCase()} ngắn, hấp dẫn dành cho trẻ em (6-12 tuổi). 
      Viết 2-3 đoạn ngắn mở đầu câu chuyện, sau đó đưa ra 3 lựa chọn để trẻ quyết định hướng đi tiếp theo.
      Format JSON: { "title": "Tên truyện", "text": "Nội dung mở đầu...", "choices": [{"id": "1", "text": "Lựa chọn 1"}, {"id": "2", "text": "Lựa chọn 2"}, {"id": "3", "text": "Lựa chọn 3"}] }`;

      const response = await supabase.functions.invoke('angel-ai-chat', {
        body: { 
          messages: [{ role: 'user', content: prompt }],
          userId: user?.id 
        }
      });

      if (response.error) throw response.error;

      // Parse the streamed response
      const text = await new Response(response.data).text();
      let jsonContent = "";
      
      // Extract JSON from SSE stream
      const lines = text.split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ') && line !== 'data: [DONE]') {
          try {
            const parsed = JSON.parse(line.slice(6));
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) jsonContent += content;
          } catch {}
        }
      }

      // Try to parse the JSON response
      try {
        // Find JSON in the response
        const jsonMatch = jsonContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const storyData = JSON.parse(jsonMatch[0]);
          setCurrentStory({
            title: storyData.title || "Câu chuyện mới",
            theme,
            segments: [
              { text: storyData.text, choices: storyData.choices }
            ],
            completed: false
          });
        } else {
          // Fallback if no JSON found
          setCurrentStory({
            title: `Câu chuyện ${themeInfo?.name}`,
            theme,
            segments: [{ 
              text: jsonContent || "Ngày xửa ngày xưa, trong một vương quốc xa xôi...",
              choices: [
                { id: "1", text: "Khám phá khu rừng bí ẩn" },
                { id: "2", text: "Tìm hiểu lâu đài cổ" },
                { id: "3", text: "Theo dòng sông phiêu lưu" }
              ]
            }],
            completed: false
          });
        }
      } catch {
        setCurrentStory({
          title: `Câu chuyện ${themeInfo?.name}`,
          theme,
          segments: [{ 
            text: jsonContent || "Ngày xửa ngày xưa...",
            choices: [
              { id: "1", text: "Tiếp tục cuộc phiêu lưu" },
              { id: "2", text: "Khám phá con đường mới" },
              { id: "3", text: "Quay về nhà" }
            ]
          }],
          completed: false
        });
      }
    } catch (error) {
      console.error('Error starting story:', error);
      toast({
        title: "Lỗi",
        description: "Không thể bắt đầu câu chuyện. Thử lại nhé!",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const continueStory = async (choiceId: string, choiceText: string) => {
    if (!currentStory) return;
    setIsGenerating(true);

    // Add the choice as a segment
    const updatedSegments = [
      ...currentStory.segments,
      { text: `👉 Bé chọn: "${choiceText}"`, isChoice: true }
    ];
    setCurrentStory({ ...currentStory, segments: updatedSegments });

    try {
      const storyContext = currentStory.segments.map(s => s.text).join('\n\n');
      const prompt = `Tiếp tục câu chuyện dựa trên lựa chọn của trẻ: "${choiceText}"
      
      Bối cảnh trước đó:
      ${storyContext}
      
      Viết 2-3 đoạn tiếp theo của câu chuyện, sau đó đưa ra 3 lựa chọn mới hoặc kết thúc câu chuyện nếu phù hợp.
      Format JSON: { "text": "Nội dung tiếp theo...", "choices": [{"id": "1", "text": "..."}, ...] hoặc "isEnding": true nếu kết thúc }`;

      const response = await supabase.functions.invoke('angel-ai-chat', {
        body: { 
          messages: [{ role: 'user', content: prompt }],
          userId: user?.id 
        }
      });

      if (response.error) throw response.error;

      const text = await new Response(response.data).text();
      let jsonContent = "";
      
      const lines = text.split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ') && line !== 'data: [DONE]') {
          try {
            const parsed = JSON.parse(line.slice(6));
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) jsonContent += content;
          } catch {}
        }
      }

      try {
        const jsonMatch = jsonContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const storyData = JSON.parse(jsonMatch[0]);
          const newSegment: StorySegment = {
            text: storyData.text,
            choices: storyData.isEnding ? undefined : storyData.choices
          };

          setCurrentStory({
            ...currentStory,
            segments: [...updatedSegments, newSegment],
            completed: storyData.isEnding || false
          });
        } else {
          setCurrentStory({
            ...currentStory,
            segments: [...updatedSegments, { 
              text: jsonContent,
              choices: [
                { id: "1", text: "Tiếp tục khám phá" },
                { id: "2", text: "Thử một hướng đi khác" },
                { id: "3", text: "Kết thúc câu chuyện" }
              ]
            }]
          });
        }
      } catch {
        setCurrentStory({
          ...currentStory,
          segments: [...updatedSegments, { text: jsonContent }],
          completed: true
        });
      }
    } catch (error) {
      console.error('Error continuing story:', error);
      toast({
        title: "Lỗi", 
        description: "Không thể tiếp tục câu chuyện",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const saveStory = async () => {
    if (!user || !currentStory) return;

    try {
      const { error } = await supabase.from('angel_ai_stories').insert([{
        user_id: user.id,
        title: currentStory.title,
        theme: currentStory.theme,
        content: currentStory.segments as unknown as Json,
        completed: currentStory.completed
      }]);

      if (error) throw error;

      toast({
        title: "Đã lưu!",
        description: "Câu chuyện đã được lưu vào bộ sưu tập của bé! 📚"
      });
      loadSavedStories();
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể lưu câu chuyện",
        variant: "destructive"
      });
    }
  };

  const resetStory = () => {
    setCurrentStory(null);
    setSelectedTheme(null);
  };

  return (
    <div className="h-full flex flex-col">
      <AnimatePresence mode="wait">
        {!currentStory ? (
          <motion.div
            key="theme-selection"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex-1 flex flex-col items-center justify-center p-6"
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-20 h-20 mb-6 rounded-full bg-gradient-to-br from-yellow-300 via-pink-300 to-purple-400 flex items-center justify-center shadow-xl"
            >
              <BookOpen className="w-10 h-10 text-white" />
            </motion.div>

            <h2 className="text-2xl font-bold mb-2 text-center bg-gradient-to-r from-yellow-600 via-pink-500 to-purple-500 bg-clip-text text-transparent">
              Kể Chuyện Cùng Angel 📖
            </h2>
            <p className="text-muted-foreground text-center mb-8 max-w-md">
              Chọn thể loại câu chuyện bé muốn nghe và cùng Angel sáng tạo nên những câu chuyện tuyệt vời!
            </p>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-2xl">
              {STORY_THEMES.map((theme) => (
                <motion.button
                  key={theme.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => startNewStory(theme.id)}
                  disabled={isGenerating}
                  className={`p-6 rounded-2xl bg-gradient-to-br ${theme.color} text-white shadow-lg hover:shadow-xl transition-shadow disabled:opacity-50`}
                >
                  <span className="text-4xl block mb-2">{theme.icon}</span>
                  <span className="font-bold">{theme.name}</span>
                </motion.button>
              ))}
            </div>

            {isGenerating && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-8 flex items-center gap-3 text-muted-foreground"
              >
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Angel đang sáng tạo câu chuyện...</span>
              </motion.div>
            )}

            {/* Saved stories */}
            {savedStories.length > 0 && (
              <div className="mt-10 w-full max-w-2xl">
                <h3 className="text-lg font-bold mb-4">📚 Truyện đã lưu</h3>
                <div className="grid gap-3">
                  {savedStories.slice(0, 3).map((story) => (
                    <motion.button
                      key={story.id}
                      whileHover={{ x: 5 }}
                      onClick={() => setCurrentStory(story)}
                      className="flex items-center gap-3 p-4 bg-white dark:bg-slate-800 rounded-xl border hover:border-primary/50 transition-colors text-left"
                    >
                      <span className="text-2xl">
                        {STORY_THEMES.find(t => t.id === story.theme)?.icon || "📖"}
                      </span>
                      <div className="flex-1">
                        <p className="font-medium">{story.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {story.completed ? "✅ Hoàn thành" : "📝 Đang viết"}
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </motion.button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="story-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col"
          >
            {/* Story header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-3">
                <span className="text-2xl">
                  {STORY_THEMES.find(t => t.id === currentStory.theme)?.icon || "📖"}
                </span>
                <div>
                  <h3 className="font-bold">{currentStory.title}</h3>
                  <p className="text-xs text-muted-foreground">
                    {currentStory.segments.length} đoạn
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={saveStory}>
                  <Save className="w-4 h-4 mr-1" />
                  Lưu
                </Button>
                <Button variant="ghost" size="sm" onClick={resetStory}>
                  <RefreshCw className="w-4 h-4 mr-1" />
                  Mới
                </Button>
              </div>
            </div>

            {/* Story content */}
            <ScrollArea className="flex-1 p-4">
              <div className="max-w-2xl mx-auto space-y-4">
                {currentStory.segments.map((segment, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`p-4 rounded-xl ${
                      segment.isChoice 
                        ? "bg-purple-100 dark:bg-purple-900/30 border-l-4 border-purple-500 italic"
                        : "bg-white dark:bg-slate-800 shadow-md"
                    }`}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {segment.text}
                    </p>

                    {/* Choices */}
                    {segment.choices && segment.choices.length > 0 && !isGenerating && (
                      <div className="mt-4 space-y-2">
                        <p className="text-xs text-muted-foreground font-medium mb-2">
                          Bé muốn làm gì tiếp theo? 🤔
                        </p>
                        {segment.choices.map((choice) => (
                          <motion.button
                            key={choice.id}
                            whileHover={{ x: 5 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => continueStory(choice.id, choice.text)}
                            className="w-full text-left p-3 rounded-lg bg-gradient-to-r from-yellow-50 to-pink-50 dark:from-yellow-900/20 dark:to-pink-900/20 border border-yellow-200/50 dark:border-yellow-500/30 hover:border-yellow-400 transition-colors"
                          >
                            <span className="text-sm">{choice.text}</span>
                          </motion.button>
                        ))}
                      </div>
                    )}
                  </motion.div>
                ))}

                {/* Loading */}
                {isGenerating && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl"
                  >
                    <Wand2 className="w-5 h-5 text-yellow-600 animate-pulse" />
                    <span className="text-sm text-yellow-600">Angel đang viết tiếp...</span>
                  </motion.div>
                )}

                {/* Story completed */}
                {currentStory.completed && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center p-6 bg-gradient-to-r from-yellow-100 via-pink-100 to-purple-100 dark:from-yellow-900/30 dark:via-pink-900/30 dark:to-purple-900/30 rounded-2xl"
                  >
                    <Sparkles className="w-12 h-12 mx-auto mb-3 text-yellow-500" />
                    <h4 className="text-xl font-bold mb-2">🎉 Hết rồi!</h4>
                    <p className="text-muted-foreground mb-4">
                      Bé đã hoàn thành câu chuyện tuyệt vời này!
                    </p>
                    <div className="flex justify-center gap-3">
                      <Button onClick={saveStory} variant="outline">
                        <Save className="w-4 h-4 mr-2" />
                        Lưu truyện
                      </Button>
                      <Button onClick={resetStory}>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Truyện mới
                      </Button>
                    </div>
                  </motion.div>
                )}
              </div>
            </ScrollArea>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}