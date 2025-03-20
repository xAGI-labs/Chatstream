"use client"

import { useState, useEffect } from "react"
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription 
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { 
  MoreVertical, 
  Pencil, 
  Trash2, 
  Loader2, 
  Image as ImageIcon, 
  RefreshCw,
  AlertCircle
} from "lucide-react"
import { toast } from "sonner"
import Image from "next/image"
import { useRouter } from "next/navigation"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface HomeCharacter {
  id: string
  name: string
  description: string | null
  imageUrl: string | null
  category: string
  displayOrder: number
  createdAt: string
}

interface HomeCharacterTableProps {
  searchQuery: string
}

export function HomeCharacterTable({ searchQuery }: HomeCharacterTableProps) {
  const [characters, setCharacters] = useState<HomeCharacter[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const [editCharacter, setEditCharacter] = useState<HomeCharacter | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [regeneratingImageId, setRegeneratingImageId] = useState<string | null>(null)
  const pageSize = 10
  const router = useRouter()

  useEffect(() => {
    fetchCharacters()
  }, [currentPage, searchQuery])

  const fetchCharacters = async () => {
    try {
      setLoading(true)
      const response = await fetch(
        `/api/admin/home-characters?page=${currentPage}&limit=${pageSize}&search=${encodeURIComponent(searchQuery)}`
      )
      
      if (!response.ok) {
        throw new Error("Failed to fetch characters")
      }
      
      const data = await response.json()
      setCharacters(data.characters)
      setTotalPages(Math.ceil(data.total / pageSize))
    } catch (error) {
      console.error("Error fetching characters:", error)
      toast.error("Failed to load characters")
    } finally {
      setLoading(false)
    }
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleDeleteClick = (id: string) => {
    setDeletingId(id)
    setConfirmDeleteOpen(true)
  }

  const handleDelete = async () => {
    if (!deletingId) return
    
    try {
      const response = await fetch(`/api/admin/home-characters/${deletingId}`, {
        method: "DELETE"
      })
      
      if (!response.ok) {
        throw new Error("Failed to delete character")
      }
      
      toast.success("Character deleted successfully")
      fetchCharacters()
    } catch (error) {
      console.error("Error deleting character:", error)
      toast.error("Failed to delete character")
    } finally {
      setDeletingId(null)
      setConfirmDeleteOpen(false)
    }
  }

  const handleEditClick = (character: HomeCharacter) => {
    setEditCharacter(character)
    setEditDialogOpen(true)
  }

  const handleRegenerateImage = async (id: string) => {
    try {
      setRegeneratingImageId(id)
      
      const response = await fetch(`/api/admin/home-characters/${id}/regenerate-image`, {
        method: "POST"
      })
      
      if (!response.ok) {
        throw new Error("Failed to regenerate image")
      }
      
      toast.success("Image regeneration initiated")
      fetchCharacters()
    } catch (error) {
      console.error("Error regenerating image:", error)
      toast.error("Failed to regenerate image")
    } finally {
      setRegeneratingImageId(null)
    }
  }

  if (loading && characters.length === 0) {
    return (
      <div className="h-96 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div>
      <Table>
        <TableCaption>A list of home page characters in the system</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Image</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Display Order</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {characters.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center h-24">
                <div className="flex flex-col items-center justify-center text-muted-foreground">
                  <AlertCircle className="h-8 w-8 mb-2" />
                  <p>No characters found</p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            characters.map((character) => (
              <TableRow key={character.id}>
                <TableCell>
                  <div className="h-12 w-12 relative rounded-md overflow-hidden bg-muted">
                    {character.imageUrl ? (
                      <Image
                        src={character.imageUrl}
                        alt={character.name}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-muted text-muted-foreground">
                        <ImageIcon className="h-6 w-6" />
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell className="font-medium">{character.name}</TableCell>
                <TableCell className="max-w-[200px] truncate">
                  {character.description || "—"}
                </TableCell>
                <TableCell>{character.category}</TableCell>
                <TableCell>{character.displayOrder}</TableCell>
                <TableCell>{new Date(character.createdAt).toLocaleDateString()}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEditClick(character)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleRegenerateImage(character.id)}
                        disabled={regeneratingImageId === character.id}
                      >
                        {regeneratingImageId === character.id ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Regenerating...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Regenerate Image
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={() => handleDeleteClick(character.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {totalPages > 1 && (
        <Pagination className="mt-4">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                className={currentPage <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
            
            {Array.from({ length: totalPages }).map((_, i) => (
              <PaginationItem key={i}>
                <PaginationLink
                  isActive={currentPage === i + 1}
                  onClick={() => handlePageChange(i + 1)}
                >
                  {i + 1}
                </PaginationLink>
              </PaginationItem>
            ))}
            
            <PaginationItem>
              <PaginationNext 
                onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
                className={currentPage >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      {/* Edit Dialog */}
      {editCharacter && (
        <EditHomeCharacterDialog
          character={editCharacter}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onSuccess={() => {
            fetchCharacters()
            setEditCharacter(null)
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the character
              from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              {deletingId ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

interface EditHomeCharacterDialogProps {
  character: HomeCharacter
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

function EditHomeCharacterDialog({ character, open, onOpenChange, onSuccess }: EditHomeCharacterDialogProps) {
  const [name, setName] = useState(character.name)
  const [description, setDescription] = useState(character.description || "")
  const [category, setCategory] = useState(character.category)
  const [displayOrder, setDisplayOrder] = useState(character.displayOrder.toString())
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (open) {
      setName(character.name)
      setDescription(character.description || "")
      setCategory(character.category)
      setDisplayOrder(character.displayOrder.toString())
    }
  }, [character, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name) {
      toast.error("Name is required")
      return
    }
    
    try {
      setIsLoading(true)
      
      const response = await fetch(`/api/admin/home-characters/${character.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: description || null,
          category,
          displayOrder: parseInt(displayOrder)
        })
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to update character: ${errorText || response.statusText}`)
      }
      
      toast.success("Character updated successfully")
      onOpenChange(false)
      onSuccess()
      
    } catch (error: any) {
      toast.error(error.message || "Failed to update character")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      if (isLoading) return
      onOpenChange(newOpen)
    }}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Home Character</DialogTitle>
          <DialogDescription>
            Update the character details
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Name*</Label>
              <Input
                id="edit-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Character name"
                disabled={isLoading}
                required
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your character"
                disabled={isLoading}
                className="h-20"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="edit-category">Category*</Label>
              <select
                id="edit-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={isLoading}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="popular">Popular</option>
                <option value="educational">Educational</option>
              </select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="edit-display-order">Display Order*</Label>
              <Input
                id="edit-display-order"
                type="number"
                value={displayOrder}
                onChange={(e) => setDisplayOrder(e.target.value)}
                placeholder="Display order"
                disabled={isLoading}
                required
              />
              <p className="text-xs text-muted-foreground">
                Lower numbers appear first. Popular characters typically use 0-99, educational 100+
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!name || isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
