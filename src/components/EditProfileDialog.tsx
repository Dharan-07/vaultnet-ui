import { useState, useRef } from 'react';
import { Camera, Loader2, User, Save, X, Trash2, Globe, MapPin, Twitter, Github, Linkedin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { ImageCropper } from './ImageCropper';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface EditProfileDialogProps {
  trigger?: React.ReactNode;
}

export const EditProfileDialog = ({ trigger }: EditProfileDialogProps) => {
  const { user, updateProfile, uploadProfilePhoto, deleteProfilePhoto } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [website, setWebsite] = useState(user?.website || '');
  const [location, setLocation] = useState(user?.location || '');
  const [twitter, setTwitter] = useState(user?.twitter || '');
  const [github, setGithub] = useState(user?.github || '');
  const [linkedin, setLinkedin] = useState(user?.linkedin || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isDeletingPhoto, setIsDeletingPhoto] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  // Cropper state
  const [showCropper, setShowCropper] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      setName(user?.name || '');
      setBio(user?.bio || '');
      setWebsite(user?.website || '');
      setLocation(user?.location || '');
      setTwitter(user?.twitter || '');
      setGithub(user?.github || '');
      setLinkedin(user?.linkedin || '');
      setPreviewUrl(null);
      setShowCropper(false);
      setImageToCrop(null);
    }
  };

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type and size
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid File',
        description: 'Please select an image file',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File Too Large',
        description: 'Image must be less than 5MB',
        variant: 'destructive',
      });
      return;
    }

    // Read file and open cropper
    const reader = new FileReader();
    reader.onload = (e) => {
      setImageToCrop(e.target?.result as string);
      setShowCropper(true);
    };
    reader.readAsDataURL(file);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    setShowCropper(false);
    setImageToCrop(null);
    
    // Show preview immediately
    const previewReader = new FileReader();
    previewReader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    previewReader.readAsDataURL(croppedBlob);

    // Upload to Firebase
    setIsUploadingPhoto(true);
    const result = await uploadProfilePhoto(croppedBlob);
    setIsUploadingPhoto(false);

    if (result.error) {
      toast({
        title: 'Upload Failed',
        description: result.error,
        variant: 'destructive',
      });
      setPreviewUrl(null);
    } else {
      toast({
        title: 'Photo Updated',
        description: 'Your profile photo has been updated successfully',
      });
    }
  };

  const handleCropCancel = () => {
    setShowCropper(false);
    setImageToCrop(null);
  };

  const handleDeletePhoto = async () => {
    setIsDeletingPhoto(true);
    const result = await deleteProfilePhoto();
    setIsDeletingPhoto(false);

    if (result.error) {
      toast({
        title: 'Delete Failed',
        description: result.error,
        variant: 'destructive',
      });
    } else {
      setPreviewUrl(null);
      toast({
        title: 'Photo Deleted',
        description: 'Your profile photo has been removed',
      });
    }
  };

  const handleSave = async () => {
    setIsUpdating(true);
    
    const result = await updateProfile({ 
      name, 
      bio, 
      website,
      location,
      twitter,
      github,
      linkedin,
    });
    
    setIsUpdating(false);

    if (result.error) {
      toast({
        title: 'Update Failed',
        description: result.error,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Profile Updated',
        description: 'Your profile has been updated successfully',
      });
      setOpen(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          {trigger || (
            <Button variant="outline" size="sm">
              Edit Profile
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>
              Update your profile information and photo
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="social">Social Links</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-6 py-4">
              {/* Profile Photo */}
              <div className="flex flex-col items-center gap-4">
                <div className="relative group">
                  <Avatar className="w-24 h-24 border-4 border-background shadow-lg">
                    <AvatarImage 
                      src={previewUrl || user?.profilePhotoUrl} 
                      alt={user?.name || 'Profile'} 
                    />
                    <AvatarFallback className="text-2xl bg-primary/10">
                      {user?.name ? getInitials(user.name) : <User className="w-10 h-10" />}
                    </AvatarFallback>
                  </Avatar>
                  
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingPhoto}
                    className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                  >
                    {isUploadingPhoto ? (
                      <Loader2 className="w-6 h-6 text-white animate-spin" />
                    ) : (
                      <Camera className="w-6 h-6 text-white" />
                    )}
                  </button>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoSelect}
                    className="hidden"
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingPhoto}
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Change Photo
                  </Button>
                  
                  {(user?.profilePhotoUrl || previewUrl) && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          disabled={isDeletingPhoto}
                          className="text-destructive hover:text-destructive"
                        >
                          {isDeletingPhoto ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Profile Photo?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently remove your profile photo. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleDeletePhoto} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
                
                <p className="text-xs text-muted-foreground">
                  Click to upload a new photo (max 5MB)
                </p>
              </div>

              {/* Name Input */}
              <div className="space-y-2">
                <Label htmlFor="name">Display Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  className="transition-all duration-300 focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {/* Bio Input */}
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us about yourself..."
                  className="resize-none transition-all duration-300 focus:ring-2 focus:ring-primary/20"
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  {bio.length}/200 characters
                </p>
              </div>

              {/* Location Input */}
              <div className="space-y-2">
                <Label htmlFor="location" className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Location
                </Label>
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="City, Country"
                  className="transition-all duration-300 focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {/* Website Input */}
              <div className="space-y-2">
                <Label htmlFor="website" className="flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Website
                </Label>
                <Input
                  id="website"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://your-website.com"
                  className="transition-all duration-300 focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </TabsContent>

            <TabsContent value="social" className="space-y-6 py-4">
              {/* Twitter */}
              <div className="space-y-2">
                <Label htmlFor="twitter" className="flex items-center gap-2">
                  <Twitter className="w-4 h-4" />
                  Twitter / X
                </Label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 text-sm text-muted-foreground bg-muted border border-r-0 border-input rounded-l-md">
                    @
                  </span>
                  <Input
                    id="twitter"
                    value={twitter}
                    onChange={(e) => setTwitter(e.target.value)}
                    placeholder="username"
                    className="rounded-l-none transition-all duration-300 focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              {/* GitHub */}
              <div className="space-y-2">
                <Label htmlFor="github" className="flex items-center gap-2">
                  <Github className="w-4 h-4" />
                  GitHub
                </Label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 text-sm text-muted-foreground bg-muted border border-r-0 border-input rounded-l-md">
                    github.com/
                  </span>
                  <Input
                    id="github"
                    value={github}
                    onChange={(e) => setGithub(e.target.value)}
                    placeholder="username"
                    className="rounded-l-none transition-all duration-300 focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              {/* LinkedIn */}
              <div className="space-y-2">
                <Label htmlFor="linkedin" className="flex items-center gap-2">
                  <Linkedin className="w-4 h-4" />
                  LinkedIn
                </Label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 text-sm text-muted-foreground bg-muted border border-r-0 border-input rounded-l-md">
                    linkedin.com/in/
                  </span>
                  <Input
                    id="linkedin"
                    value={linkedin}
                    onChange={(e) => setLinkedin(e.target.value)}
                    placeholder="username"
                    className="rounded-l-none transition-all duration-300 focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1 gap-2"
            >
              <X className="w-4 h-4" />
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isUpdating || !name.trim()}
              className="flex-1 gap-2"
            >
              {isUpdating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Cropper Modal */}
      {imageToCrop && (
        <ImageCropper
          imageSrc={imageToCrop}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
          open={showCropper}
        />
      )}
    </>
  );
};
