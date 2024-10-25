import { Artwork, User } from '@prisma/client'
import { Prisma } from '@prisma/client'

export type CreateArtworkData = {
  title: string;
  description?: string;
  authorId: string;
  state: AnimationState; // Replace 'any' with a more specific type if possible
}

export type BoxConfig = {
  id: string;
  color: string;  // Can be hex (#00ff00) or hsl format
  speed: number;
  size: number;
  rotationAxis: 'x' | 'y';
  position: [number, number, number];  // 3D position array
  isSelected: boolean;
}

// Types for saving animation state
export type AnimationState = {
  backgroundColor: string;  // Hex color format
  boxes: BoxConfig[];
  selectedBoxId: string;  // Always matches one of the box IDs
}

export type RotatingBoxesCanvasProps = {
  initialBoxes: BoxConfig[];
  initialSelectedBox?: string;
  initialBackgroundColor?: string;
}

export type BoxesCanvas = {
  state: AnimationState;
}

export type ArtworkWithAuthor = {
  id: string;
  title: string;
  description: string | null;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
  likes: number;
  state: AnimationState;
  author: {
    id: string;
    clerk_id: string;
    username: string | null;
    email: string;
    name: string | null;
    bio: string | null;
    createdAt: Date;
    updatedAt: Date;
  };
}


// Different includes give different types
// You can use this pattern to see exactly what type Prisma is inferring from your schema
export type ArtworkBasic = Prisma.ArtworkGetPayload<{}>  // No includes
export type ArtworkBelongingToAuthor = Prisma.ArtworkGetPayload<{ include: { author: true } }>
export type ArtworkWithFavorites = Prisma.ArtworkGetPayload<{ include: { favourite: true } }>