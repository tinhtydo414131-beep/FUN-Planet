// Sound effects utility - centralized sound playing functions

export const playBlingSound = () => {
  try {
    const audio = new Audio('/audio/rich-reward.mp3');
    audio.volume = 0.5;
    audio.play().catch(console.error);
  } catch (e) {
    console.log('Audio not available');
  }
};

export const playRewardSound = () => {
  try {
    const audio = new Audio('/audio/rich-reward.mp3');
    audio.volume = 0.5;
    audio.play().catch(console.error);
  } catch (e) {
    console.log('Audio not available');
  }
};

export const playWeeklySummarySound = () => {
  try {
    const audio = new Audio('/audio/radiant-dreamland.mp3');
    audio.volume = 0.5;
    audio.play().catch(console.error);
  } catch (e) {
    console.log('Audio not available');
  }
};

export const playCoinSound = () => {
  try {
    const audio = new Audio('https://pub-cb953c014b4d44f980fbe6e051a12745.r2.dev/audio/coin-reward.mp3');
    audio.volume = 0.5;
    audio.play().catch(console.error);
  } catch (e) {
    console.log('Audio not available');
  }
};
