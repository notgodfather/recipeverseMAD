import React from 'react';
import RecipeCard from './RecipeCard';

// This component was previously a wide variant. 
// In the Instagram-style redesign, all posts share the same unified post layout.
// We just pass the props through to the main RecipeCard.

export default function RecipeCardWide(props: any) {
  return <RecipeCard {...props} />;
}
