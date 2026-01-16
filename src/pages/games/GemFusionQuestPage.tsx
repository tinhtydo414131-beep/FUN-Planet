import React from 'react';
import { useNavigate } from 'react-router-dom';
import GemFusionQuest from '@/components/games/GemFusionQuest';

const GemFusionQuestPage: React.FC = () => {
  const navigate = useNavigate();
  
  return <GemFusionQuest onBack={() => navigate(-1)} />;
};

export default GemFusionQuestPage;
