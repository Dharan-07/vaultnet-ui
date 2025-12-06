import { Link } from 'react-router-dom';
import { Download, Eye, Clock, Coins } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent, CardFooter, CardHeader } from './ui/card';
import { TrustScoreBadge } from './TrustScoreBadge';
import { VotingButtons } from './VotingButtons';

export interface Model {
  id: number;
  name: string;
  description: string;
  uploader: string;
  price: string;
  cid: string;
  versionCount: number;
  downloads: number;
  category: string;
  uploadDate: string;
  tags: string[];
}

interface ModelCardProps {
  model: Model;
}

export const ModelCard = ({ model }: ModelCardProps) => {
  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  return (
    <Card className="card-hover h-full flex flex-col">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <Link to={`/model/${model.id}`}>
              <h3 className="font-semibold text-lg hover:text-primary transition-colors truncate">
                {model.name}
              </h3>
            </Link>
            <p className="text-sm text-muted-foreground mt-1">
              by <span className="font-mono">{formatAddress(model.uploader)}</span>
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge variant="secondary">{model.category}</Badge>
            <TrustScoreBadge modelId={model.id} modelName={model.name} cid={model.cid} />
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1">
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
          {model.description}
        </p>

        <div className="flex flex-wrap gap-1 mb-4">
          {model.tags.slice(0, 3).map((tag, idx) => (
            <Badge key={idx} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
          {model.tags.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{model.tags.length - 3}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Download className="w-4 h-4" />
            <span>{model.downloads}</span>
          </div>
          <div className="flex items-center gap-1">
            <Eye className="w-4 h-4" />
            <span>v{model.versionCount}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{formatDate(model.uploadDate)}</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex flex-col gap-3 pt-4 border-t">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-1 text-lg font-semibold">
            <Coins className="w-5 h-5 text-primary" />
            <span>{model.price} ETH</span>
          </div>
          <VotingButtons modelId={model.id} compact />
        </div>
        <Link to={`/model/${model.id}`} className="w-full">
          <Button size="sm" className="w-full">View Model</Button>
        </Link>
      </CardFooter>
    </Card>
  );
};
