export interface Character {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;  // This accepts string or undefined, but not null
}

// Helper function to generate avatar URLs that was missing
const getAvatarUrl = (name: string, size = 256) => {
  return `https://robohash.org/${encodeURIComponent(name)}?size=${size}x${size}&set=set4`;
};

// Characters will use the Together API via our avatar generation endpoint
export const popularCharacters: Character[] = [
  {
    id: "harry-potter",
    name: "Harry Potter",
    description: "The Boy Who Lived, from Hogwarts School of Witchcraft and Wizardry",
    // For pre-defined characters, we'll use undefined to trigger generation when first accessed
    imageUrl: undefined
  },
  {
    id: "sherlock-holmes",
    name: "Sherlock Holmes",
    description: "The world's greatest detective from 221B Baker Street",
    imageUrl: undefined
  },
  {
    id: "chota-bheem",
    name: "Chota Bheem",
    description: "The brave and strong boy from Dholakpur",
    imageUrl: undefined
  },
  {
    id: "einstein",
    name: "Albert Einstein",
    description: "The theoretical physicist who developed the theory of relativity",
    imageUrl: undefined
  }
];

export const educationalCharacters: Character[] = [
  {
    id: "marie-curie",
    name: "Marie Curie",
    description: "Pioneer in the field of radioactivity and two-time Nobel Prize winner",
    imageUrl: undefined
  },
  {
    id: "aryabhatta",
    name: "Aryabhatta",
    description: "Ancient Indian mathematician and astronomer",
    imageUrl: undefined
  },
  {
    id: "isaac-newton",
    name: "Isaac Newton",
    description: "Physicist, mathematician and astronomer known for the laws of motion",
    imageUrl: undefined
  },
  {
    id: "pythagoras",
    name: "Pythagoras",
    description: "Ancient Greek philosopher and mathematician known for the Pythagorean theorem",
    imageUrl: undefined
  }
];
