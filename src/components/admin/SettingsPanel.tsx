import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Settings,
  Users,
  Shield,
  Bell,
  Mail,
  Smartphone,
  Slack,
  Webhook,
  Trash2,
  Plus,
  Edit,
  Crown,
  UserCheck,
  X,
} from "lucide-react";

interface User {
  id: string;
  email: string;
  full_name: string;
  role: "admin" | "user" | "viewer";
  permissions: string[];
  created_at: string;
  last_sign_in_at: string;
  is_active: boolean;
}

interface NotificationSettings {
  email: boolean;
  sms: boolean;
  slack: boolean;
  webhook: boolean;
  push: boolean;
  emailAddress?: string;
  phoneNumber?: string;
  slackWebhook?: string;
  webhookUrl?: string;
}

interface SettingsPanelProps {
  open?: boolean;
  onClose?: () => void;
}

const SettingsPanel = ({ open = true, onClose }: SettingsPanelProps) => {
  const [activeTab, setActiveTab] = useState("general");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showAddUser, setShowAddUser] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserName, setNewUserName] = useState("");
  const [newUserRole, setNewUserRole] = useState<"admin" | "user" | "viewer">("user");
  
  const [notifications, setNotifications] = useState<NotificationSettings>({
    email: true,
    sms: false,
    slack: false,
    webhook: false,
    push: true,
    emailAddress: "",
    phoneNumber: "",
    slackWebhook: "",
    webhookUrl: "",
  });

  const { user, hasPermission, refreshPermissions } = useAuth();
  const { toast } = useToast();

  // Mock data for demo
  useEffect(() => {
    setUsers([
      {
        id: "1",
        email: "admin@example.com",
        full_name: "Admin User",
        role: "admin",
        permissions: ["admin", "edit_alerts", "manage_users", "view_reports"],
        created_at: "2023-01-01T00:00:00Z",
        last_sign_in_at: "2023-06-15T14:30:00Z",
        is_active: true,
      },
      {
        id: "2",
        email: "user@example.com",
        full_name: "Regular User",
        role: "user",
        permissions: ["edit_alerts", "view_reports"],
        created_at: "2023-02-01T00:00:00Z",
        last_sign_in_at: "2023-06-14T10:15:00Z",
        is_active: true,
      },
      {
        id: "3",
        email: "viewer@example.com",
        full_name: "View Only User",
        role: "viewer",
        permissions: ["view_reports"],
        created_at: "2023-03-01T00:00:00Z",
        last_sign_in_at: "2023-06-13T16:45:00Z",
        is_active: false,
      },
    ]);
  }, []);

  const handleUpdateUser = async (userId: string, updates: Partial<User>) => {
    setLoading(true);
    try {
      // In real app, this would make an API call
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updates } : u));
      toast({
        title: "User Updated",
        description: "User permissions and role have been updated successfully.",
      });
      setEditingUser(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update user.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async () => {
    if (!newUserEmail || !newUserName) return;
    
    setLoading(true);
    try {
      const newUser: User = {
        id: Date.now().toString(),
        email: newUserEmail,
        full_name: newUserName,
        role: newUserRole,
        permissions: getDefaultPermissions(newUserRole),
        created_at: new Date().toISOString(),
        last_sign_in_at: new Date().toISOString(),
        is_active: true,
      };
      
      setUsers(prev => [...prev, newUser]);
      toast({
        title: "User Added",
        description: `${newUserName} has been added with ${newUserRole} role.`,
      });
      
      setShowAddUser(false);
      setNewUserEmail("");
      setNewUserName("");
      setNewUserRole("user");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add user.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    setLoading(true);
    try {
      setUsers(prev => prev.filter(u => u.id !== userId));
      toast({
        title: "User Deleted",
        description: "User has been removed from the system.",
      });
      setShowDeleteConfirm(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete user.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getDefaultPermissions = (role: "admin" | "user" | "viewer"): string[] => {
    switch (role) {
      case "admin":
        return ["admin", "edit_alerts", "manage_users", "view_reports", "manage_settings"];
      case "user":
        return ["edit_alerts", "view_reports"];
      case "viewer":
        return ["view_reports"];
      default:
        return [];
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin":
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case "user":
        return <UserCheck className="h-4 w-4 text-blue-500" />;
      case "viewer":
        return <Users className="h-4 w-4 text-gray-500" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  const updateNotificationSetting = (key: keyof NotificationSettings, value: boolean | string) => {
    setNotifications(prev => ({ ...prev, [key]: value }));
  };

  const saveNotificationSettings = () => {
    // In real app, this would save to database
    toast({
      title: "Settings Saved",
      description: "Notification settings have been updated successfully.",
    });
  };

  if (!hasPermission("manage_settings") && !hasPermission("admin")) {
    return (
      <Dialog open={open} onOpenChange={() => onClose?.()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-red-500" />
              Access Denied
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-4">
            <p>You don't have permission to access settings.</p>
            <p className="text-sm text-muted-foreground mt-2">
              Contact your administrator to request access.
            </p>
          </div>
          <DialogFooter>
            <Button onClick={() => onClose?.()}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={() => onClose?.()}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            System Settings
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">System Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>System Version</Label>
                    <p className="text-sm text-muted-foreground">v1.0.0</p>
                  </div>
                  <div>
                    <Label>Total Users</Label>
                    <p className="text-sm text-muted-foreground">{users.length}</p>
                  </div>
                  <div>
                    <Label>Active Monitors</Label>
                    <p className="text-sm text-muted-foreground">12</p>
                  </div>
                  <div>
                    <Label>System Status</Label>
                    <Badge variant="outline" className="text-green-600">Operational</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">User Management</h3>
              <Button onClick={() => setShowAddUser(true)} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </div>

            <Card>
              <CardContent className="p-0">
                <div className="space-y-0">
                  {users.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border-b last:border-b-0">
                      <div className="flex items-center gap-3">
                        {getRoleIcon(user.role)}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{user.full_name}</span>
                            <Badge variant={user.is_active ? "outline" : "secondary"}>
                              {user.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                          <div className="flex gap-1 mt-1">
                            {user.permissions.map((perm) => (
                              <Badge key={perm} variant="secondary" className="text-xs">
                                {perm}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingUser(user)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowDeleteConfirm(user.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Notification Channels</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5" />
                      <div>
                        <Label>Email Notifications</Label>
                        <p className="text-sm text-muted-foreground">Receive alerts via email</p>
                      </div>
                    </div>
                    <Switch
                      checked={notifications.email}
                      onCheckedChange={(checked) => updateNotificationSetting("email", checked)}
                    />
                  </div>
                  {notifications.email && (
                    <div className="ml-8">
                      <Label htmlFor="email-address">Email Address</Label>
                      <Input
                        id="email-address"
                        placeholder="alerts@example.com"
                        value={notifications.emailAddress}
                        onChange={(e) => updateNotificationSetting("emailAddress", e.target.value)}
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Smartphone className="h-5 w-5" />
                      <div>
                        <Label>SMS Notifications</Label>
                        <p className="text-sm text-muted-foreground">Receive alerts via SMS</p>
                      </div>
                    </div>
                    <Switch
                      checked={notifications.sms}
                      onCheckedChange={(checked) => updateNotificationSetting("sms", checked)}
                    />
                  </div>
                  {notifications.sms && (
                    <div className="ml-8">
                      <Label htmlFor="phone-number">Phone Number</Label>
                      <Input
                        id="phone-number"
                        placeholder="+1234567890"
                        value={notifications.phoneNumber}
                        onChange={(e) => updateNotificationSetting("phoneNumber", e.target.value)}
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Slack className="h-5 w-5" />
                      <div>
                        <Label>Slack Integration</Label>
                        <p className="text-sm text-muted-foreground">Send alerts to Slack channel</p>
                      </div>
                    </div>
                    <Switch
                      checked={notifications.slack}
                      onCheckedChange={(checked) => updateNotificationSetting("slack", checked)}
                    />
                  </div>
                  {notifications.slack && (
                    <div className="ml-8">
                      <Label htmlFor="slack-webhook">Slack Webhook URL</Label>
                      <Input
                        id="slack-webhook"
                        placeholder="https://hooks.slack.com/services/..."
                        value={notifications.slackWebhook}
                        onChange={(e) => updateNotificationSetting("slackWebhook", e.target.value)}
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Webhook className="h-5 w-5" />
                      <div>
                        <Label>Webhook Integration</Label>
                        <p className="text-sm text-muted-foreground">Send alerts to custom webhook</p>
                      </div>
                    </div>
                    <Switch
                      checked={notifications.webhook}
                      onCheckedChange={(checked) => updateNotificationSetting("webhook", checked)}
                    />
                  </div>
                  {notifications.webhook && (
                    <div className="ml-8">
                      <Label htmlFor="webhook-url">Webhook URL</Label>
                      <Input
                        id="webhook-url"
                        placeholder="https://api.example.com/webhook"
                        value={notifications.webhookUrl}
                        onChange={(e) => updateNotificationSetting("webhookUrl", e.target.value)}
                      />
                    </div>
                  )}
                </div>

                <Button onClick={saveNotificationSettings} className="w-full">
                  Save Notification Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onClose?.()}>
            Close
          </Button>
        </DialogFooter>

        {/* Add User Dialog */}
        <Dialog open={showAddUser} onOpenChange={setShowAddUser}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New User</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="new-user-name">Full Name</Label>
                <Input
                  id="new-user-name"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="John Doe"
                />
              </div>
              <div>
                <Label htmlFor="new-user-email">Email</Label>
                <Input
                  id="new-user-email"
                  type="email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="john@example.com"
                />
              </div>
              <div>
                <Label htmlFor="new-user-role">Role</Label>
                <Select value={newUserRole} onValueChange={(value: "admin" | "user" | "viewer") => setNewUserRole(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin - Full access</SelectItem>
                    <SelectItem value="user">User - Can edit alerts</SelectItem>
                    <SelectItem value="viewer">Viewer - Read only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddUser(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddUser} disabled={!newUserEmail || !newUserName || loading}>
                {loading ? "Adding..." : "Add User"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit User Dialog */}
        {editingUser && (
          <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit User: {editingUser.full_name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Role</Label>
                  <Select
                    value={editingUser.role}
                    onValueChange={(value: "admin" | "user" | "viewer") =>
                      setEditingUser({ ...editingUser, role: value, permissions: getDefaultPermissions(value) })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin - Full access</SelectItem>
                      <SelectItem value="user">User - Can edit alerts</SelectItem>
                      <SelectItem value="viewer">Viewer - Read only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select
                    value={editingUser.is_active ? "active" : "inactive"}
                    onValueChange={(value) =>
                      setEditingUser({ ...editingUser, is_active: value === "active" })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditingUser(null)}>
                  Cancel
                </Button>
                <Button onClick={() => handleUpdateUser(editingUser.id, editingUser)} disabled={loading}>
                  {loading ? "Updating..." : "Update User"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!showDeleteConfirm} onOpenChange={() => setShowDeleteConfirm(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete User</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this user? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => showDeleteConfirm && handleDeleteUser(showDeleteConfirm)}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsPanel;