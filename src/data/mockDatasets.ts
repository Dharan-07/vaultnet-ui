export interface Dataset {
  id: number;
  name: string;
  description: string;
  uploader: string;
  cid: string;
  downloads: number;
  category: string;
  uploadDate: string;
  size: string;
  format: string;
  tags: string[];
}

export const mockDatasets: Dataset[] = [
  {
    id: 1,
    name: "ImageNet Subset",
    description: "A curated subset of ImageNet containing 10,000 labeled images across 100 categories for image classification research.",
    uploader: "0x1234567890abcdef1234567890abcdef12345678",
    cid: "QmImageNet123abc",
    downloads: 2450,
    category: "Image Classification",
    uploadDate: "2024-01-15",
    size: "2.5 GB",
    format: "JPEG/PNG",
    tags: ["images", "classification", "computer-vision"]
  },
  {
    id: 2,
    name: "NLP Sentiment Corpus",
    description: "Large-scale sentiment analysis dataset with 500K labeled reviews from multiple sources including social media and e-commerce.",
    uploader: "0xabcdef1234567890abcdef1234567890abcdef12",
    cid: "QmSentiment456def",
    downloads: 1890,
    category: "Natural Language Processing",
    uploadDate: "2024-02-20",
    size: "850 MB",
    format: "CSV/JSON",
    tags: ["nlp", "sentiment", "text"]
  },
  {
    id: 3,
    name: "Audio Speech Commands",
    description: "Collection of 65,000 one-second audio clips of 30 different spoken words for speech recognition training.",
    uploader: "0x9876543210fedcba9876543210fedcba98765432",
    cid: "QmAudioSpeech789ghi",
    downloads: 1230,
    category: "Audio Processing",
    uploadDate: "2024-03-05",
    size: "1.8 GB",
    format: "WAV",
    tags: ["audio", "speech", "recognition"]
  },
  {
    id: 4,
    name: "Medical Imaging X-Ray",
    description: "Anonymized chest X-ray dataset with 50,000 images labeled for various pulmonary conditions.",
    uploader: "0xfedcba9876543210fedcba9876543210fedcba98",
    cid: "QmMedicalXray012jkl",
    downloads: 3200,
    category: "Medical Imaging",
    uploadDate: "2024-01-28",
    size: "4.2 GB",
    format: "DICOM/PNG",
    tags: ["medical", "xray", "healthcare"]
  },
  {
    id: 5,
    name: "Time Series Financial",
    description: "Historical stock market data spanning 20 years with minute-level granularity for algorithmic trading research.",
    uploader: "0x5678901234abcdef5678901234abcdef56789012",
    cid: "QmFinancial345mno",
    downloads: 980,
    category: "Financial",
    uploadDate: "2024-03-12",
    size: "3.1 GB",
    format: "CSV/Parquet",
    tags: ["financial", "time-series", "stocks"]
  },
  {
    id: 6,
    name: "Object Detection COCO",
    description: "Subset of COCO dataset with 80 object categories and bounding box annotations for object detection models.",
    uploader: "0x3456789012abcdef3456789012abcdef34567890",
    cid: "QmCOCO678pqr",
    downloads: 2100,
    category: "Object Detection",
    uploadDate: "2024-02-08",
    size: "5.6 GB",
    format: "JPEG/JSON",
    tags: ["detection", "coco", "bounding-box"]
  }
];

export const getDatasetById = (id: number): Dataset | undefined => {
  return mockDatasets.find(dataset => dataset.id === id);
};

export const getDatasetCategories = (): string[] => {
  return [...new Set(mockDatasets.map(dataset => dataset.category))];
};
