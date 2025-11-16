import { Model } from '@/components/ModelCard';

// Mock data for development and demonstration
export const mockModels: Model[] = [
  {
    id: 1,
    name: 'GPT-Style Language Model',
    description: 'A powerful transformer-based language model trained on diverse text data. Capable of text generation, summarization, and question answering.',
    uploader: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
    price: '0.5',
    cid: 'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG',
    versionCount: 3,
    downloads: 1234,
    category: 'NLP',
    uploadDate: '2024-01-15',
    tags: ['nlp', 'transformer', 'pytorch', 'text-generation'],
  },
  {
    id: 2,
    name: 'Image Classification CNN',
    description: 'Convolutional Neural Network for image classification. Trained on ImageNet with 95% accuracy. Perfect for computer vision tasks.',
    uploader: '0x8ba1f109551bD432803012645Ac136ddd64DBA72',
    price: '0.3',
    cid: 'QmPZ9gcCEpqKTo6aq61g2nXGUhM4iCL3ewB6LDXZCtgVLQ',
    versionCount: 5,
    downloads: 892,
    category: 'Computer Vision',
    uploadDate: '2024-02-01',
    tags: ['cnn', 'image-classification', 'tensorflow', 'imagenet'],
  },
  {
    id: 3,
    name: 'Sentiment Analysis BERT',
    description: 'Fine-tuned BERT model for sentiment analysis. Achieves state-of-the-art results on multiple benchmarks.',
    uploader: '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed',
    price: '0.25',
    cid: 'QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco',
    versionCount: 2,
    downloads: 567,
    category: 'NLP',
    uploadDate: '2024-01-28',
    tags: ['bert', 'sentiment', 'nlp', 'huggingface'],
  },
  {
    id: 4,
    name: 'Object Detection YOLO',
    description: 'Real-time object detection model based on YOLOv8. Detects 80+ object classes with high accuracy and speed.',
    uploader: '0xdD870fA1b7C4700F2BD7f44238821C26f7392148',
    price: '0.4',
    cid: 'QmYjtig7VJQ6XsnUjqqJvj7QaMcCAwtrgNdahSiFofrE7o',
    versionCount: 4,
    downloads: 1456,
    category: 'Computer Vision',
    uploadDate: '2024-02-10',
    tags: ['yolo', 'object-detection', 'pytorch', 'real-time'],
  },
  {
    id: 5,
    name: 'Speech Recognition Whisper',
    description: 'Multilingual speech recognition model. Supports 90+ languages with high accuracy transcription.',
    uploader: '0x03C6FcED478cBbC9a4FAB34eF9f40767739D1Ff7',
    price: '0.6',
    cid: 'QmRGnSUfKjFLvKxJKC8BDyR3BVvqYwcwKcM3gXkf6pNjkq',
    versionCount: 2,
    downloads: 789,
    category: 'Audio',
    uploadDate: '2024-01-20',
    tags: ['whisper', 'speech-recognition', 'audio', 'multilingual'],
  },
  {
    id: 6,
    name: 'Time Series Forecasting LSTM',
    description: 'LSTM-based model for time series prediction. Optimized for financial and weather forecasting applications.',
    uploader: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
    price: '0.35',
    cid: 'QmUNLLsPACCz1vLxQVkXqqLX5R1X345qqfHbsf67hvA3Nn',
    versionCount: 3,
    downloads: 432,
    category: 'Time Series',
    uploadDate: '2024-02-05',
    tags: ['lstm', 'forecasting', 'time-series', 'tensorflow'],
  },
  {
    id: 7,
    name: 'Text-to-Image Diffusion',
    description: 'Stable Diffusion-based model for generating high-quality images from text prompts.',
    uploader: '0x8ba1f109551bD432803012645Ac136ddd64DBA72',
    price: '0.8',
    cid: 'QmRAQB6YaCyidP37UdDnjFY5vQuiBrcqdyoW1CuDgwxkD4',
    versionCount: 6,
    downloads: 2341,
    category: 'Generative',
    uploadDate: '2024-01-10',
    tags: ['diffusion', 'text-to-image', 'stable-diffusion', 'pytorch'],
  },
  {
    id: 8,
    name: 'Recommendation System',
    description: 'Collaborative filtering model for personalized recommendations. Trained on e-commerce data.',
    uploader: '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed',
    price: '0.2',
    cid: 'QmT5NvUtoM5nWFfrQdVrFtvGfKFmG7AHE8P34isapyhCxX',
    versionCount: 2,
    downloads: 321,
    category: 'Recommendation',
    uploadDate: '2024-02-12',
    tags: ['collaborative-filtering', 'recommendations', 'pytorch'],
  },
];

// Get featured models (highest downloads)
export const getFeaturedModels = () => {
  return [...mockModels]
    .sort((a, b) => b.downloads - a.downloads)
    .slice(0, 4);
};

// Get trending models (most recent with good downloads)
export const getTrendingModels = () => {
  return [...mockModels]
    .sort((a, b) => {
      const dateA = new Date(a.uploadDate).getTime();
      const dateB = new Date(b.uploadDate).getTime();
      return dateB - dateA;
    })
    .slice(0, 6);
};

// Get model by ID
export const getModelById = (id: number): Model | undefined => {
  return mockModels.find(model => model.id === id);
};

// Filter models
export const filterModels = (
  models: Model[],
  filters: {
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    search?: string;
  }
) => {
  return models.filter(model => {
    if (filters.category && model.category !== filters.category) return false;
    
    const price = parseFloat(model.price);
    if (filters.minPrice !== undefined && price < filters.minPrice) return false;
    if (filters.maxPrice !== undefined && price > filters.maxPrice) return false;
    
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return (
        model.name.toLowerCase().includes(searchLower) ||
        model.description.toLowerCase().includes(searchLower) ||
        model.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }
    
    return true;
  });
};

// Get unique categories
export const getCategories = (): string[] => {
  return Array.from(new Set(mockModels.map(model => model.category)));
};
