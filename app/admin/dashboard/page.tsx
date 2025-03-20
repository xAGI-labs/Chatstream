"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { AdminAuthProvider, useAdminAuth } from "@/lib/admin-auth"
import { withAdminAuth } from "@/lib/with-admin-auth"

function AdminDashboardContent() {
  const { logout } = useAdminAuth()
  const [activeTab, setActiveTab] = useState<'users' | 'content' | 'stats'>('users')

  const handleLogout = async () => {
    try {
      await logout()
      toast.success("Logged out successfully")
    } catch (error) {
      console.error('Logout error:', error)
      toast.error("Logout failed")
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <header className="flex justify-between items-center mb-8 pb-4 border-b">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <Button variant="outline" onClick={handleLogout}>Logout</Button>
        </header>
        
        {/* Tab Navigation */}
        <div className="flex border-b mb-6">
          <button 
            className={`px-4 py-2 font-medium ${activeTab === 'users' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'}`}
            onClick={() => setActiveTab('users')}
          >
            Users
          </button>
          <button 
            className={`px-4 py-2 font-medium ${activeTab === 'content' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'}`}
            onClick={() => setActiveTab('content')}
          >
            Content
          </button>
          <button 
            className={`px-4 py-2 font-medium ${activeTab === 'stats' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'}`}
            onClick={() => setActiveTab('stats')}
          >
            Statistics
          </button>
        </div>
        
        {/* Tab Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeTab === 'users' && (
            <>
              <div className="bg-card border border-border p-6 rounded-lg shadow-sm">
                <h2 className="text-xl font-semibold mb-4">User Management</h2>
                <p className="text-muted-foreground mb-4">Manage user accounts and permissions.</p>
                <Button variant="secondary" size="sm">View Users</Button>
              </div>
              
              <div className="bg-card border border-border p-6 rounded-lg shadow-sm">
                <h2 className="text-xl font-semibold mb-4">User Roles</h2>
                <p className="text-muted-foreground mb-4">Manage roles and access levels.</p>
                <Button variant="secondary" size="sm">Manage Roles</Button>
              </div>
            </>
          )}
          
          {activeTab === 'content' && (
            <>
              <div className="bg-card border border-border p-6 rounded-lg shadow-sm">
                <h2 className="text-xl font-semibold mb-4">Character Management</h2>
                <p className="text-muted-foreground mb-4">Manage AI characters in the system.</p>
                <Button variant="secondary" size="sm">Manage Characters</Button>
              </div>
              
              <div className="bg-card border border-border p-6 rounded-lg shadow-sm">
                <h2 className="text-xl font-semibold mb-4">Content Moderation</h2>
                <p className="text-muted-foreground mb-4">Review and moderate user-generated content.</p>
                <Button variant="secondary" size="sm">Review Content</Button>
              </div>
            </>
          )}
          
          {activeTab === 'stats' && (
            <>
              <div className="bg-card border border-border p-6 rounded-lg shadow-sm">
                <h2 className="text-xl font-semibold mb-4">User Statistics</h2>
                <p className="text-muted-foreground mb-4">View user activity and engagement metrics.</p>
                <div className="h-40 flex items-center justify-center bg-muted/30 rounded-md">
                  <p className="text-muted-foreground">Chart placeholder</p>
                </div>
              </div>
              
              <div className="bg-card border border-border p-6 rounded-lg shadow-sm">
                <h2 className="text-xl font-semibold mb-4">System Performance</h2>
                <p className="text-muted-foreground mb-4">Monitor system health and performance.</p>
                <div className="h-40 flex items-center justify-center bg-muted/30 rounded-md">
                  <p className="text-muted-foreground">Chart placeholder</p>
                </div>
              </div>
              
              <div className="bg-card border border-border p-6 rounded-lg shadow-sm">
                <h2 className="text-xl font-semibold mb-4">API Usage</h2>
                <p className="text-muted-foreground mb-4">Track API usage and costs.</p>
                <div className="h-40 flex items-center justify-center bg-muted/30 rounded-md">
                  <p className="text-muted-foreground">Chart placeholder</p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// Wrap the component with admin auth protection
const ProtectedAdminDashboard = withAdminAuth(AdminDashboardContent)

// Export a wrapper component that provides the auth context
export default function AdminDashboard() {
  return (
    <AdminAuthProvider>
      <ProtectedAdminDashboard />
    </AdminAuthProvider>
  )
}