export interface Character {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
}

// Helper function to generate avatar URLs
const getAvatarUrl = (name: string) => {
  return `/api/avatar?name=${encodeURIComponent(name)}&width=200&height=200`
}

export const popularCharacters: Character[] = [
  {
    id: "harry-potter",
    name: "Harry Potter",
    description: "The Boy Who Lived, from Hogwarts School of Witchcraft and Wizardry",
    imageUrl: getAvatarUrl("Harry Potter")
  },
  {
    id: "sherlock-holmes",
    name: "Sherlock Holmes",
    description: "The world's greatest detective from 221B Baker Street",
    imageUrl: getAvatarUrl("Sherlock Holmes")
  },
  {
    id: "chota-bheem",
    name: "Chota Bheem",
    description: "The brave and strong boy from Dholakpur",
    imageUrl: getAvatarUrl("Chota Bheem")
  },
  {
    id: "einstein",
    name: "Albert Einstein",
    description: "The theoretical physicist who developed the theory of relativity",
    imageUrl: getAvatarUrl("Albert Einstein")
  }
]

export const educationalCharacters: Character[] = [
  {
    id: "marie-curie",
    name: "Marie Curie",
    description: "Pioneer in the field of radioactivity and two-time Nobel Prize winner",
    imageUrl: getAvatarUrl("Marie Curie")
  },
  {
    id: "aryabhatta",
    name: "Aryabhatta",
    description: "Ancient Indian mathematician and astronomer",
    imageUrl: getAvatarUrl("Aryabhatta")
  },
  {
    id: "isaac-newton",
    name: "Isaac Newton",
    description: "Physicist, mathematician and astronomer known for the laws of motion",
    imageUrl: getAvatarUrl("Isaac Newton")
  },
  {
    id: "pythagoras",
    name: "Pythagoras",
    description: "Ancient Greek philosopher and mathematician known for the Pythagorean theorem",
    imageUrl: getAvatarUrl("Pythagoras")
  }
]
