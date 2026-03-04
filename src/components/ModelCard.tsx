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
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    return `${Math.floor(diffDays / 30)}m ago`;
  };

  return (
    <Card className="card-hover h-full flex flex-col">
      <CardHeader className="pb-3 md:pb-4">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between md:gap-2 gap-2">
          <div className="flex-1 min-w-0">
            <Link to={`/model/${model.id}`}>
              <h3 className="font-semibold text-base md:text-lg hover:text-primary transition-colors truncate">
                {model.name}
              </h3>
            </Link>
            <p className="text-xs md:text-sm text-muted-foreground mt-1 truncate">
              by <span className="font-mono">{formatAddress(model.uploader)}</span>
            </p>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Badge variant="secondary" className="text-xs md:text-sm">{model.category}</Badge>
          </div>
        </div>
        <div className="flex justify-between mt-2">
          <TrustScoreBadge modelId={model.id} modelName={model.name} cid={model.cid} />
        </div>
      </CardHeader>

      <CardContent className="flex-1 pb-3 md:pb-4">
        <p className="text-xs md:text-sm text-muted-foreground line-clamp-2 mb-3">
          {model.description}
        </p>

        <div className="flex flex-wrap gap-1 mb-3">
          {model.tags.slice(0, 2).map((tag, idx) => (
            <Badge key={idx} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
          {model.tags.length > 2 && (
            <Badge variant="outline" className="text-xs">
              +{model.tags.length - 2}
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2 text-xs md:text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Download className="w-3 md:w-4 h-3 md:h-4 flex-shrink-0" />
            <span className="truncate">{model.downloads}</span>
          </div>
          <div className="flex items-center gap-1">
            <Eye className="w-3 md:w-4 h-3 md:h-4 flex-shrink-0" />
            <span className="truncate">v{model.versionCount}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-3 md:w-4 h-3 md:h-4 flex-shrink-0" />
            <span className="truncate">{formatDate(model.uploadDate)}</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex flex-col gap-2 md:gap-3 pt-3 md:pt-4 border-t">
        <div className="flex items-center justify-between w-full gap-2">
          <div className="flex items-center gap-1 text-base md:text-lg font-semibold flex-shrink-0">
            <Coins className="w-4 md:w-5 h-4 md:h-5 text-primary" />
            <span className="truncate">{model.price} ETH</span>
          </div>
          <div className="flex-shrink-0">
            <VotingButtons modelId={model.id} compact />
          </div>
        </div>
        <Link to={`/model/${model.id}`} className="w-full">
          <Button size="sm" className="w-full text-xs md:text-sm">View Model</Button>
        </Link>
      </CardFooter>
    </Card>
  );
};
